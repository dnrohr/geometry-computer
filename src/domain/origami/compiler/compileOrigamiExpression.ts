import type { Expr } from "../../expression/types";
import { formatExpression } from "../../expression/format";
import {
  creaseObject,
  labelObject,
  lineObject,
  paperBoundaryObject,
  pointObject,
  segmentObject,
  type OrigamiArithmeticMacroKind,
  type OrigamiFoldProof,
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

const macroProofText: Record<
  OrigamiArithmeticMacroKind,
  Pick<OrigamiFoldProof, "title" | "intuition" | "givens" | "conclusion">
> = {
  "place-input": {
    title: "Input length placement",
    intuition:
      "A supplied length can be marked as a baseline segment on the paper.",
    givens: ["A sampled input length", "An oriented paper baseline"],
    conclusion: "The marked segment represents the supplied input length.",
  },
  "copy-length": {
    title: "Length copy",
    intuition:
      "A fold transfer can carry a known length to a new baseline position.",
    givens: ["A source segment", "A target baseline"],
    conclusion: "The copied segment preserves the source length.",
  },
  constant: {
    title: "Constant length placement",
    intuition:
      "A fixed scalar multiple of the unit can be marked on the baseline.",
    givens: ["The unit length", "A numeric scalar"],
    conclusion: "The marked segment represents the requested constant.",
  },
  add: {
    title: "Origami addition trace",
    intuition: "Adjacent baseline transfers concatenate lengths.",
    givens: ["Two source segments", "A shared oriented baseline"],
    conclusion: "The result segment has length equal to the sum.",
  },
  sub: {
    title: "Origami subtraction trace",
    intuition:
      "An opposite-oriented transfer subtracts one directed length from another.",
    givens: ["Two source segments", "A directed baseline"],
    conclusion: "The result segment has length equal to the difference.",
  },
  mul: {
    title: "Origami multiplication trace",
    intuition:
      "Intercept-style folds preserve a scale ratio between source lengths.",
    givens: ["Two source segments", "A unit baseline"],
    conclusion: "The result segment represents the product.",
  },
  div: {
    title: "Origami division trace",
    intuition:
      "The same intercept-style trace can scale by a reciprocal length.",
    givens: ["A numerator segment", "A nonzero denominator segment"],
    conclusion: "The result segment represents the quotient.",
  },
  square: {
    title: "Origami square trace",
    intuition:
      "Squaring is multiplication with the same length in both input roles.",
    givens: ["A source segment", "A unit baseline"],
    conclusion: "The result segment represents the squared length.",
  },
  sqrt: {
    title: "Origami square-root trace",
    intuition:
      "A geometric-mean fold trace extracts the positive square-root length.",
    givens: ["A nonnegative source segment", "A unit baseline"],
    conclusion: "The result segment represents the square root.",
  },
};

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
  const revealActions: OrigamiFoldScene["revealActions"] = [];
  const proofs = new Map<string, OrigamiFoldProof>();
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
    sourceValues: number[] = [],
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
    const unitReferenceObjectIds: string[] = [];
    const guideLineObjectIds: string[] = [];
    const foldCreaseObjectIds = [crease.id];
    const selectedIntersectionObjectIds: string[] = [];
    const reflectedObjectIds: string[] = [];
    const extraCreatedObjectIds: string[] = [];

    if (operation === "mul" || operation === "square") {
      const firstLength = scaledLength(sourceValues[0] ?? 1);
      const secondLength = scaledLength(sourceValues[1] ?? 1);
      const unitStart = pointAt(1, y + 0.42);
      const unitEnd = pointAt(2.6, y + 0.42);
      const firstEnd = pointAt(1 + firstLength, y + 0.72);
      const secondEnd = pointAt(
        1,
        y + 0.72 + Math.min(1.1, secondLength * 0.4),
      );
      const productGuidePoint = pointAt(
        1 + Math.min(10.5, scaledLength(value)),
        y + 0.72,
      );
      const ratioDirection = {
        x: secondEnd.x - unitEnd.x,
        y: secondEnd.y - unitEnd.y,
      };
      const unitSegment = addObject(
        segmentObject(
          unitStart,
          unitEnd,
          metadata(
            ids.next("origami-unit-segment"),
            "intermediate",
            sourceIds,
            stepId,
            "unit reference",
          ),
        ),
      );
      const firstCopy = addObject(
        segmentObject(
          pointAt(1, y + 0.72),
          firstEnd,
          metadata(
            ids.next("origami-input-copy"),
            "intermediate",
            sourceIds.slice(0, 1),
            stepId,
            `${key} first factor copy`,
          ),
        ),
      );
      const secondCopy = addObject(
        segmentObject(
          pointAt(1, y + 0.72),
          secondEnd,
          metadata(
            ids.next("origami-input-copy"),
            "intermediate",
            sourceIds.slice(1, 2),
            stepId,
            `${key} second factor copy`,
          ),
        ),
      );
      const ratioGuide = addObject(
        lineObject(
          {
            point: unitEnd,
            direction: ratioDirection,
          },
          metadata(
            ids.next("origami-guide-line"),
            "intermediate",
            [unitSegment.id, secondCopy.id],
            stepId,
            `${key} ratio guide`,
          ),
        ),
      );
      const scaleGuide = addObject(
        lineObject(
          {
            point: firstEnd,
            direction: ratioDirection,
          },
          metadata(
            ids.next("origami-guide-line"),
            "intermediate",
            [firstCopy.id, ratioGuide.id],
            stepId,
            `${key} parallel scale guide`,
          ),
        ),
      );
      const productPoint = addObject(
        pointObject(
          productGuidePoint,
          metadata(
            ids.next("origami-intersection"),
            "intermediate",
            [firstCopy.id, secondCopy.id, scaleGuide.id],
            stepId,
            `${key} scaled point`,
          ),
        ),
      );
      const ratioCrease = addObject(
        creaseObject(
          {
            point: unitEnd,
            direction: ratioDirection,
          },
          "unassigned",
          metadata(
            ids.next("origami-crease"),
            "crease",
            [unitSegment.id, secondCopy.id],
            stepId,
            `${key} ratio crease`,
          ),
          "mul-ratio-guide",
        ),
      );
      const projectionCrease = addObject(
        creaseObject(
          {
            point: productGuidePoint,
            direction: pointAt(0, 1),
          },
          "unassigned",
          metadata(
            ids.next("origami-crease"),
            "crease",
            [productPoint.id, segment.id],
            stepId,
            `${key} product projection crease`,
          ),
          "mul-product-projection",
        ),
      );

      unitReferenceObjectIds.push(unitSegment.id);
      guideLineObjectIds.push(ratioGuide.id, scaleGuide.id);
      foldCreaseObjectIds.push(ratioCrease.id, projectionCrease.id);
      selectedIntersectionObjectIds.push(productPoint.id);
      extraCreatedObjectIds.push(
        unitSegment.id,
        firstCopy.id,
        secondCopy.id,
        ratioGuide.id,
        scaleGuide.id,
        productPoint.id,
        ratioCrease.id,
        projectionCrease.id,
      );
    }

    if (operation === "div") {
      const numeratorLength = scaledLength(sourceValues[0] ?? 1);
      const denominatorLength = scaledLength(sourceValues[1] ?? 1);
      const unitStart = pointAt(1, y + 0.42);
      const unitEnd = pointAt(2.6, y + 0.42);
      const numeratorEnd = pointAt(1 + numeratorLength, y + 0.72);
      const denominatorEnd = pointAt(
        1,
        y + 0.72 + Math.min(1.1, denominatorLength * 0.4),
      );
      const reciprocalPointPosition = pointAt(
        1 +
          Math.min(10.5, 1.6 / Math.max(0.35, Math.abs(sourceValues[1] ?? 1))),
        y + 0.72,
      );
      const quotientPointPosition = pointAt(
        1 + Math.min(10.5, scaledLength(value)),
        y + 0.72,
      );
      const reciprocalDirection = {
        x: unitEnd.x - denominatorEnd.x,
        y: unitEnd.y - denominatorEnd.y,
      };
      const unitSegment = addObject(
        segmentObject(
          unitStart,
          unitEnd,
          metadata(
            ids.next("origami-unit-segment"),
            "intermediate",
            sourceIds,
            stepId,
            "division unit reference",
          ),
        ),
      );
      const numeratorCopy = addObject(
        segmentObject(
          pointAt(1, y + 0.72),
          numeratorEnd,
          metadata(
            ids.next("origami-input-copy"),
            "intermediate",
            sourceIds.slice(0, 1),
            stepId,
            `${key} numerator copy`,
          ),
        ),
      );
      const denominatorCopy = addObject(
        segmentObject(
          pointAt(1, y + 0.72),
          denominatorEnd,
          metadata(
            ids.next("origami-input-copy"),
            "intermediate",
            sourceIds.slice(1, 2),
            stepId,
            `${key} denominator copy`,
          ),
        ),
      );
      const reciprocalGuide = addObject(
        lineObject(
          {
            point: denominatorEnd,
            direction: reciprocalDirection,
          },
          metadata(
            ids.next("origami-guide-line"),
            "intermediate",
            [denominatorCopy.id, unitSegment.id],
            stepId,
            `${key} reciprocal guide`,
          ),
        ),
      );
      const quotientGuide = addObject(
        lineObject(
          {
            point: numeratorEnd,
            direction: reciprocalDirection,
          },
          metadata(
            ids.next("origami-guide-line"),
            "intermediate",
            [numeratorCopy.id, reciprocalGuide.id],
            stepId,
            `${key} quotient guide`,
          ),
        ),
      );
      const reciprocalPoint = addObject(
        pointObject(
          reciprocalPointPosition,
          metadata(
            ids.next("origami-intersection"),
            "intermediate",
            [denominatorCopy.id, reciprocalGuide.id, unitSegment.id],
            stepId,
            `${key} reciprocal point`,
          ),
        ),
      );
      const quotientPoint = addObject(
        pointObject(
          quotientPointPosition,
          metadata(
            ids.next("origami-intersection"),
            "intermediate",
            [numeratorCopy.id, quotientGuide.id, reciprocalPoint.id],
            stepId,
            `${key} quotient point`,
          ),
        ),
      );
      const reciprocalCrease = addObject(
        creaseObject(
          {
            point: denominatorEnd,
            direction: reciprocalDirection,
          },
          "unassigned",
          metadata(
            ids.next("origami-crease"),
            "crease",
            [denominatorCopy.id, unitSegment.id],
            stepId,
            `${key} reciprocal crease`,
          ),
          "div-reciprocal-guide",
        ),
      );
      const quotientCrease = addObject(
        creaseObject(
          {
            point: quotientPointPosition,
            direction: pointAt(0, 1),
          },
          "unassigned",
          metadata(
            ids.next("origami-crease"),
            "crease",
            [quotientPoint.id, segment.id],
            stepId,
            `${key} quotient projection crease`,
          ),
          "div-quotient-projection",
        ),
      );

      unitReferenceObjectIds.push(unitSegment.id);
      guideLineObjectIds.push(reciprocalGuide.id, quotientGuide.id);
      foldCreaseObjectIds.push(reciprocalCrease.id, quotientCrease.id);
      selectedIntersectionObjectIds.push(reciprocalPoint.id, quotientPoint.id);
      extraCreatedObjectIds.push(
        unitSegment.id,
        numeratorCopy.id,
        denominatorCopy.id,
        reciprocalGuide.id,
        quotientGuide.id,
        reciprocalPoint.id,
        quotientPoint.id,
        reciprocalCrease.id,
        quotientCrease.id,
      );
    }

    if (operation === "sqrt") {
      const inputLength = scaledLength(sourceValues[0] ?? 0);
      const unitStart = pointAt(1, y + 0.42);
      const unitEnd = pointAt(2.6, y + 0.42);
      const inputEnd = pointAt(unitEnd.x + inputLength, y + 0.42);
      const midpointPosition = pointAt(
        (unitStart.x + inputEnd.x) / 2,
        y + 0.42,
      );
      const sqrtPointPosition = pointAt(
        midpointPosition.x,
        y + 0.42 - Math.min(1.1, scaledLength(value) * 0.35),
      );
      const unitSegment = addObject(
        segmentObject(
          unitStart,
          unitEnd,
          metadata(
            ids.next("origami-unit-segment"),
            "intermediate",
            sourceIds,
            stepId,
            "square-root unit reference",
          ),
        ),
      );
      const inputCopy = addObject(
        segmentObject(
          unitEnd,
          inputEnd,
          metadata(
            ids.next("origami-input-copy"),
            "intermediate",
            sourceIds,
            stepId,
            `${key} radicand copy`,
          ),
        ),
      );
      const baselineGuide = addObject(
        lineObject(
          {
            point: unitStart,
            direction: pointAt(1, 0),
          },
          metadata(
            ids.next("origami-guide-line"),
            "intermediate",
            [unitSegment.id, inputCopy.id],
            stepId,
            `${key} unit-plus-input baseline`,
          ),
        ),
      );
      const midpoint = addObject(
        pointObject(
          midpointPosition,
          metadata(
            ids.next("origami-midpoint"),
            "intermediate",
            [unitSegment.id, inputCopy.id],
            stepId,
            `${key} baseline midpoint`,
          ),
        ),
      );
      const auxiliaryGuide = addObject(
        lineObject(
          {
            point: midpointPosition,
            direction: pointAt(1, -0.45),
          },
          metadata(
            ids.next("origami-guide-line"),
            "intermediate",
            [midpoint.id, baselineGuide.id],
            stepId,
            `${key} geometric-mean guide`,
          ),
        ),
      );
      const sqrtPoint = addObject(
        pointObject(
          sqrtPointPosition,
          metadata(
            ids.next("origami-intersection"),
            "intermediate",
            [midpoint.id, auxiliaryGuide.id, inputCopy.id],
            stepId,
            `${key} square-root point`,
          ),
        ),
      );
      const midpointCrease = addObject(
        creaseObject(
          {
            point: midpointPosition,
            direction: pointAt(0, 1),
          },
          "unassigned",
          metadata(
            ids.next("origami-crease"),
            "crease",
            [midpoint.id, baselineGuide.id],
            stepId,
            `${key} midpoint crease`,
          ),
          "sqrt-midpoint-fold",
        ),
      );
      const extractionCrease = addObject(
        creaseObject(
          {
            point: sqrtPointPosition,
            direction: pointAt(0, 1),
          },
          "unassigned",
          metadata(
            ids.next("origami-crease"),
            "crease",
            [sqrtPoint.id, segment.id],
            stepId,
            `${key} square-root extraction crease`,
          ),
          "sqrt-perpendicular-extraction",
        ),
      );

      unitReferenceObjectIds.push(unitSegment.id);
      guideLineObjectIds.push(baselineGuide.id, auxiliaryGuide.id);
      foldCreaseObjectIds.push(midpointCrease.id, extractionCrease.id);
      selectedIntersectionObjectIds.push(sqrtPoint.id);
      extraCreatedObjectIds.push(
        unitSegment.id,
        inputCopy.id,
        baselineGuide.id,
        midpoint.id,
        auxiliaryGuide.id,
        sqrtPoint.id,
        midpointCrease.id,
        extractionCrease.id,
      );
    }

    const createdObjectIds = [
      sourcePoint.id,
      targetPoint.id,
      segment.id,
      crease.id,
      label.id,
      ...extraCreatedObjectIds,
    ];
    const proofClaimId = `origami-claim-${operation}`;
    steps.push({
      id: stepId,
      title: `Trace ${key}`,
      summary,
      operation,
      macroTrace: {
        macroId: stepId,
        operation,
        sourceSegmentObjectIds: sourceIds,
        unitReferenceObjectIds,
        guideLineObjectIds,
        foldCreaseObjectIds,
        reflectedObjectIds,
        selectedIntersectionObjectIds,
        resultSegmentObjectIds: [segment.id],
        proofClaimIds: [proofClaimId],
        branchSelections: [
          {
            id:
              operation === "mul"
                ? "mul-intercept-similar-triangle"
                : operation === "square"
                  ? "square-multiplication-specialization"
                  : operation === "div"
                    ? "div-reciprocal-intercept"
                    : operation === "sqrt"
                      ? "sqrt-geometric-mean"
                      : `${operation}-baseline-transfer`,
            label:
              operation === "mul"
                ? "Intercept similar-triangle branch"
                : operation === "square"
                  ? "Square via multiplication branch"
                  : operation === "div"
                    ? "Reciprocal intercept branch"
                    : operation === "sqrt"
                      ? "Geometric-mean square-root branch"
                      : "Deterministic baseline transfer",
            selected: true,
            reason:
              operation === "mul"
                ? "The selected branch keeps the unit reference and copied factors on the positive guide axes."
                : operation === "square"
                  ? "The selected branch reuses multiplication geometry with the copied source length as the second factor."
                  : operation === "div"
                    ? "The selected branch constructs the positive reciprocal of the denominator before projecting the quotient."
                    : operation === "sqrt"
                      ? "The selected branch uses the positive geometric-mean height over the unit-plus-input baseline."
                      : "The O3 trace uses one deterministic baseline placement until the richer fold geometry is expanded.",
          },
        ],
        degeneracyObjectIds: [],
      },
      inputObjectIds: sourceIds,
      outputObjectIds: [segment.id],
      createdObjectIds,
      proofId: `origami-proof-${operation}`,
    });
    const proofText = macroProofText[operation];
    proofs.set(`origami-proof-${operation}`, {
      id: `origami-proof-${operation}`,
      operation,
      title: proofText.title,
      intuition: proofText.intuition,
      givens: proofText.givens,
      claims: [
        {
          id: proofClaimId,
          text: summary,
          highlightObjectIds: [segment.id, ...sourceIds],
        },
      ],
      conclusion: proofText.conclusion,
      assumptions:
        operation === "mul" || operation === "div" || operation === "sqrt"
          ? [
              operation === "sqrt"
                ? "The sampled radicand is nonnegative, so the positive geometric-mean branch is available."
                : "This trace records the arithmetic dependency; detailed crease geometry is expanded in the rendering milestone.",
            ]
          : undefined,
    });
    const actionSize = 1 / createdObjectIds.length;
    createdObjectIds.forEach((objectId, index) => {
      revealActions.push({
        id: ids.next("origami-reveal"),
        stepId,
        objectId,
        start: index * actionSize,
        end: (index + 1) * actionSize,
        animation:
          objectId === segment.id || objectId === crease.id
            ? "draw"
            : "fade-in",
      });
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
    if (cached)
      return createTraceStep(
        key,
        cached.value,
        "copy-length",
        [cached.segmentObjectId],
        "Copy the source length to a new baseline location.",
      );
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
        "intermediate",
        [input.value],
      );
      cache.set(key, output);
      return output;
    }

    const inputs =
      expr.kind === "pow"
        ? [compile(expr.base), compile(expr.base)]
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
      "intermediate",
      inputs.map(({ value }) => value),
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
    revealActions: revealActions.map((action) => {
      const stepIndex = steps.findIndex(({ id }) => id === action.stepId);
      const stepCount = Math.max(1, steps.length);
      const stepStart = Math.max(0, stepIndex) / stepCount;
      const stepEnd = (Math.max(0, stepIndex) + 1) / stepCount;
      return {
        ...action,
        start: stepStart + action.start * (stepEnd - stepStart),
        end: stepStart + action.end * (stepEnd - stepStart),
      };
    }),
    proofs: [...proofs.values()],
  });
  return {
    ...scene,
    expression: original,
    values,
    value: result.value,
    ast,
  };
}
