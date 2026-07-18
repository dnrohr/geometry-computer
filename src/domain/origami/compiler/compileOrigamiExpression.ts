import type { Expr } from "../../expression/types";
import { formatExpression } from "../../expression/format";
import {
  creaseObject,
  labelObject,
  paperBoundaryObject,
  pointObject,
  segmentObject,
  type OrigamiArithmeticMacroKind,
  type OrigamiFoldScene,
  type OrigamiObject,
  type OrigamiObjectMetadata,
  type OrigamiPoint,
} from "../types";
import { validateOrigamiScene } from "../validateOrigamiScene";

export type CompiledOrigamiScene = OrigamiFoldScene & {
  expression: string;
  values: Record<string, number>;
  value: number;
  ast: Expr;
};

type OrigamiValue = {
  id: string;
  value: number;
  expression: string;
  segmentObjectId: string;
};

export class OrigamiCompilerError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
  }
}

class IdAllocator {
  private counts = new Map<string, number>();
  next(prefix: string) {
    const count = (this.counts.get(prefix) ?? 0) + 1;
    this.counts.set(prefix, count);
    return `${prefix}-${count}`;
  }
}

const scaledLength = (value: number) => Math.max(0.35, Math.abs(value)) * 1.6;

const metadata = (
  id: string,
  role: OrigamiObjectMetadata["role"],
  sourceObjectIds: string[],
  createdByStepId?: string,
  expression?: string,
): OrigamiObjectMetadata => ({
  id,
  role,
  createdByStepId,
  usedByStepIds: [],
  dependsOnObjectIds: sourceObjectIds,
  provenance: {
    expression,
    foldStepId: createdByStepId,
    sourceObjectIds,
  },
});

const pointAt = (x: number, y: number): OrigamiPoint => ({ x, y });

function evaluateSupported(expr: Expr, values: Record<string, number>): number {
  switch (expr.kind) {
    case "const":
      return expr.value;
    case "var": {
      const value = values[expr.name];
      if (value === undefined)
        throw new OrigamiCompilerError(
          `Supply a value for ${expr.name}.`,
          "MISSING_VARIABLE",
        );
      return value;
    }
    case "add":
      return (
        evaluateSupported(expr.left, values) +
        evaluateSupported(expr.right, values)
      );
    case "sub":
      return (
        evaluateSupported(expr.left, values) -
        evaluateSupported(expr.right, values)
      );
    case "mul":
      return (
        evaluateSupported(expr.left, values) *
        evaluateSupported(expr.right, values)
      );
    case "div": {
      const divisor = evaluateSupported(expr.right, values);
      if (divisor === 0)
        throw new OrigamiCompilerError(
          "Division by zero has no flat-origami length trace.",
          "DIVISION_BY_ZERO",
        );
      return evaluateSupported(expr.left, values) / divisor;
    }
    case "pow":
      if (expr.exponent !== 2)
        throw new OrigamiCompilerError(
          "Only squaring is currently supported through exponent syntax.",
          "UNSUPPORTED_ORIGAMI_POWER",
        );
      return evaluateSupported(expr.base, values) ** 2;
    case "sqrt": {
      const value = evaluateSupported(expr.value, values);
      if (value < 0)
        throw new OrigamiCompilerError(
          "A negative length has no real flat-origami square-root trace.",
          "NEGATIVE_SQUARE_ROOT",
        );
      return Math.sqrt(value);
    }
  }
}

export function compileOrigamiExpression(
  ast: Expr,
  values: Record<string, number>,
  original = formatExpression(ast),
): CompiledOrigamiScene {
  const ids = new IdAllocator();
  const objects: OrigamiObject[] = [
    paperBoundaryObject(
      [pointAt(0, 0), pointAt(14, 0), pointAt(14, 10), pointAt(0, 10)],
      metadata("paper-square", "paper", []),
    ),
  ];
  const steps: OrigamiFoldScene["steps"] = [];
  const cache = new Map<string, OrigamiValue>();
  let row = 0;

  const addObject = (object: OrigamiObject) => {
    objects.push(object);
    return object;
  };

  const createTraceStep = (
    key: string,
    value: number,
    operation: OrigamiArithmeticMacroKind,
    sourceIds: string[],
    summary: string,
    role: OrigamiObjectMetadata["role"] = "intermediate",
  ) => {
    const y = 1.2 + row++ * 1.35;
    const start = pointAt(1, y);
    const direction = value < 0 ? -1 : 1;
    const end = pointAt(1 + direction * scaledLength(value), y);
    const stepId = ids.next("origami-step");
    const sourcePoint = addObject(
      pointObject(
        start,
        metadata(ids.next("origami-point"), role, sourceIds, stepId, key),
      ),
    );
    const targetPoint = addObject(
      pointObject(
        end,
        metadata(ids.next("origami-point"), role, sourceIds, stepId, key),
      ),
    );
    const segment = addObject(
      segmentObject(
        start,
        end,
        metadata(
          ids.next("origami-segment"),
          role,
          [sourcePoint.id, targetPoint.id, ...sourceIds],
          stepId,
          key,
        ),
      ),
    );
    const crease = addObject(
      creaseObject(
        {
          point: pointAt(start.x, y + 0.38),
          direction: pointAt(1, 0),
        },
        "unassigned",
        metadata(
          ids.next("origami-crease"),
          "crease",
          [segment.id, ...sourceIds],
          stepId,
          key,
        ),
        `${operation}-baseline-transfer`,
      ),
    );
    const label = addObject(
      labelObject(
        pointAt((start.x + end.x) / 2, y - 0.28),
        key,
        metadata(
          ids.next("origami-label"),
          "annotation",
          [segment.id],
          stepId,
          key,
        ),
      ),
    );
    steps.push({
      id: stepId,
      title: `Trace ${key}`,
      summary,
      operation,
      inputObjectIds: sourceIds,
      outputObjectIds: [segment.id],
      createdObjectIds: [
        sourcePoint.id,
        targetPoint.id,
        segment.id,
        crease.id,
        label.id,
      ],
    });
    return {
      id: stepId,
      value,
      expression: key,
      segmentObjectId: segment.id,
    };
  };

  const compile = (expr: Expr): OrigamiValue => {
    const key = formatExpression(expr);
    const cached = cache.get(key);
    if (cached) return cached;
    const value = evaluateSupported(expr, values);

    if (expr.kind === "const" || expr.kind === "var") {
      const operation: OrigamiArithmeticMacroKind =
        expr.kind === "const" ? "constant" : "place-input";
      const output = createTraceStep(
        key,
        value,
        operation,
        [],
        operation === "constant"
          ? "Mark a fixed baseline length for this constant."
          : "Mark the supplied input length on the origami baseline.",
        "input",
      );
      cache.set(key, output);
      return output;
    }

    if (expr.kind === "sqrt") {
      const input = compile(expr.value);
      const output = createTraceStep(
        key,
        value,
        "sqrt",
        [input.segmentObjectId],
        "Use the folded geometric-mean trace to extract the square-root length.",
      );
      cache.set(key, output);
      return output;
    }

    const inputs =
      expr.kind === "pow"
        ? [compile(expr.base)]
        : [compile(expr.left), compile(expr.right)];
    const sourceIds = inputs.map(({ segmentObjectId }) => segmentObjectId);
    const operation: OrigamiArithmeticMacroKind =
      expr.kind === "pow" ? "square" : expr.kind;
    const summary: Record<OrigamiArithmeticMacroKind, string> = {
      "place-input": "Mark the supplied input length on the origami baseline.",
      "copy-length": "Copy the source length to a new baseline location.",
      constant: "Mark a fixed baseline length for this constant.",
      add: "Concatenate the two source lengths on a shared origami baseline.",
      sub: "Place the second source length in the opposite direction on the baseline.",
      mul: "Use an intercept-style fold trace to scale one length by the other.",
      div: "Use an intercept-style fold trace to scale by the reciprocal length.",
      square:
        "Reuse the multiplication fold trace with the same source length twice.",
      sqrt: "Use the folded geometric-mean trace to extract the square-root length.",
    };
    const output = createTraceStep(
      key,
      value,
      operation,
      sourceIds,
      summary[operation],
    );
    cache.set(key, output);
    return output;
  };

  const result = compile(ast);
  const resultObject = objects.find(({ id }) => id === result.segmentObjectId);
  if (resultObject) resultObject.role = "result";
  const scene = validateOrigamiScene({
    id: "origami-compiled-scene",
    title: "Compiled origami trace",
    description:
      "A separate flat-origami arithmetic trace for supported fold operations.",
    objects,
    steps,
    proofs: [],
  });
  return {
    ...scene,
    expression: original,
    values,
    value: result.value,
    ast,
  };
}
