import type { Expr } from "../../expression/types";
import { formatExpression } from "../../expression/format";
import {
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
    case "div":
    case "pow":
    case "sqrt":
      throw new OrigamiCompilerError(
        `${formatExpression(expr)} is not supported by the first origami arithmetic trace slice.`,
        "UNSUPPORTED_ORIGAMI_OPERATION",
      );
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

  const compile = (expr: Expr): OrigamiValue => {
    const key = formatExpression(expr);
    const cached = cache.get(key);
    if (cached) return cached;
    const value = evaluateSupported(expr, values);
    const y = 1.2 + row++ * 1.35;
    const start = pointAt(1, y);
    const direction = value < 0 ? -1 : 1;
    const end = pointAt(1 + direction * scaledLength(value), y);
    const stepId = ids.next("origami-step");

    if (expr.kind === "const" || expr.kind === "var") {
      const operation: OrigamiArithmeticMacroKind =
        expr.kind === "const" ? "constant" : "place-input";
      const sourcePoint = addObject(
        pointObject(
          start,
          metadata(ids.next("origami-point"), "input", [], stepId, key),
        ),
      );
      const targetPoint = addObject(
        pointObject(
          end,
          metadata(ids.next("origami-point"), "input", [], stepId, key),
        ),
      );
      const segment = addObject(
        segmentObject(
          start,
          end,
          metadata(
            ids.next("origami-segment"),
            "input",
            [sourcePoint.id, targetPoint.id],
            stepId,
            key,
          ),
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
        title: `Place ${key}`,
        summary:
          operation === "constant"
            ? "Mark a fixed baseline length for this constant."
            : "Mark the supplied input length on the origami baseline.",
        operation,
        inputObjectIds: [],
        outputObjectIds: [segment.id],
        createdObjectIds: [
          sourcePoint.id,
          targetPoint.id,
          segment.id,
          label.id,
        ],
      });
      const output = {
        id: stepId,
        value,
        expression: key,
        segmentObjectId: segment.id,
      };
      cache.set(key, output);
      return output;
    }

    if (expr.kind !== "add" && expr.kind !== "sub")
      throw new OrigamiCompilerError(
        `${key} is not supported by the first origami arithmetic trace slice.`,
        "UNSUPPORTED_ORIGAMI_OPERATION",
      );

    const left = compile(expr.left);
    const right = compile(expr.right);
    const operation = expr.kind;
    const sourceIds = [left.segmentObjectId, right.segmentObjectId];
    const sourcePoint = addObject(
      pointObject(
        start,
        metadata(
          ids.next("origami-point"),
          "intermediate",
          sourceIds,
          stepId,
          key,
        ),
      ),
    );
    const targetPoint = addObject(
      pointObject(
        end,
        metadata(
          ids.next("origami-point"),
          "intermediate",
          sourceIds,
          stepId,
          key,
        ),
      ),
    );
    const segment = addObject(
      segmentObject(
        start,
        end,
        metadata(
          ids.next("origami-segment"),
          "intermediate",
          [sourcePoint.id, targetPoint.id, ...sourceIds],
          stepId,
          key,
        ),
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
      summary:
        operation === "add"
          ? "Concatenate the two source lengths on a shared origami baseline."
          : "Place the second source length in the opposite direction on the baseline.",
      operation,
      inputObjectIds: sourceIds,
      outputObjectIds: [segment.id],
      createdObjectIds: [sourcePoint.id, targetPoint.id, segment.id, label.id],
    });
    const output = {
      id: stepId,
      value,
      expression: key,
      segmentObjectId: segment.id,
    };
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
      "A separate flat-origami arithmetic trace for supported baseline operations.",
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
