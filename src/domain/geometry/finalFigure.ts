import type { ConstructionStep, RevealAction } from "../construction/types";
import type { Expr } from "../expression/types";
import { formatExpression } from "../expression/format";
import {
  labelObject,
  pointObject,
  segmentObject,
  type GeomObject,
  type Point2,
} from "./types";
import { geometryBounds } from "./sceneLayout";

type Part = { expression: Expr; label: string; value: number };
type Marker = { after: number; expression: Expr };

const figureLabel = (expr: Expr): string => {
  switch (expr.kind) {
    case "pow":
      return expr.exponent === 2
        ? `${figureLabel(expr.base)}²`
        : `${figureLabel(expr.base)}^${expr.exponent}`;
    case "sqrt": {
      const value = figureLabel(expr.value);
      return `√${expr.value.kind === "var" || expr.value.kind === "const" ? value : `(${value})`}`;
    }
    case "mul":
      return `${figureLabel(expr.left)} · ${figureLabel(expr.right)}`;
    case "add":
      return `${figureLabel(expr.left)} + ${figureLabel(expr.right)}`;
    case "sub":
      return `${figureLabel(expr.left)} − ${figureLabel(expr.right)}`;
    case "div":
      return `${figureLabel(expr.left)} ÷ ${figureLabel(expr.right)}`;
    case "const":
      return String(expr.value);
    case "var":
      return expr.name;
  }
};

const evaluate = (expr: Expr, values: Record<string, number>): number => {
  switch (expr.kind) {
    case "const":
      return expr.value;
    case "var":
      return values[expr.name];
    case "add":
      return evaluate(expr.left, values) + evaluate(expr.right, values);
    case "sub":
      return evaluate(expr.left, values) - evaluate(expr.right, values);
    case "mul":
      return evaluate(expr.left, values) * evaluate(expr.right, values);
    case "div":
      return evaluate(expr.left, values) / evaluate(expr.right, values);
    case "pow":
      return evaluate(expr.base, values) ** expr.exponent;
    case "sqrt":
      return Math.sqrt(evaluate(expr.value, values));
  }
};

function partition(
  expr: Expr,
  values: Record<string, number>,
): { parts: Part[]; markers: Marker[] } {
  if (expr.kind === "add") {
    const left = partition(expr.left, values);
    const right = partition(expr.right, values);
    return {
      parts: [...left.parts, ...right.parts],
      markers: [
        ...left.markers,
        { after: left.parts.length, expression: expr },
        ...right.markers.map((marker) => ({
          ...marker,
          after: marker.after + left.parts.length,
        })),
      ],
    };
  }
  if (expr.kind === "mul") {
    const constant =
      expr.left.kind === "const"
        ? expr.left
        : expr.right.kind === "const"
          ? expr.right
          : undefined;
    const repeated = constant === expr.left ? expr.right : expr.left;
    if (
      constant &&
      Number.isInteger(constant.value) &&
      constant.value > 1 &&
      constant.value <= 8
    ) {
      const unit = partition(repeated, values);
      const parts: Part[] = [];
      const markers: Marker[] = [];
      for (let index = 0; index < constant.value; index += 1) {
        const offset = parts.length;
        parts.push(...unit.parts);
        markers.push(
          ...unit.markers.map((marker) => ({
            ...marker,
            after: marker.after + offset,
          })),
        );
        if (index < constant.value - 1)
          markers.push({ after: parts.length, expression: expr });
      }
      return { parts, markers };
    }
  }
  return {
    parts: [
      {
        expression: expr,
        label: figureLabel(expr),
        value: Math.abs(evaluate(expr, values)),
      },
    ],
    markers: [],
  };
}

const pointAt = (start: Point2, end: Point2, amount: number): Point2 => ({
  x: start.x + (end.x - start.x) * amount,
  y: start.y + (end.y - start.y) * amount,
});

const normal = (start: Point2, end: Point2, distance: number): Point2 => {
  const length = Math.hypot(end.x - start.x, end.y - start.y) || 1;
  return {
    x: (-(end.y - start.y) / length) * distance,
    y: ((end.x - start.x) / length) * distance,
  };
};

const offset = (point: Point2, by: Point2): Point2 => ({
  x: point.x + by.x,
  y: point.y + by.y,
});

export function buildFinalFigure(
  ast: Expr,
  values: Record<string, number>,
  objects: GeomObject[],
  steps: ConstructionStep[],
  revealActions: RevealAction[],
) {
  const result = objects.find(({ role }) => role === "result")!;
  const parentByStep = new Map(
    steps.map(({ id, parentStepId }) => [id, parentStepId ?? id]),
  );
  const rootMacroId =
    parentByStep.get(result.createdByStepId) ?? result.createdByStepId;
  const rootMacro = steps.find(({ id }) => id === rootMacroId)!;
  const extractStep = steps.find(
    ({ parentStepId, title }) =>
      parentStepId === rootMacroId &&
      /extract|mark the (sum|difference)/i.test(title),
  );
  const kept = objects.filter((object) => {
    const owner =
      parentByStep.get(object.createdByStepId) ?? object.createdByStepId;
    return owner === rootMacroId && object.createdByStepId !== extractStep?.id;
  });
  const keptIds = new Set(kept.map(({ id }) => id));
  const stepFor = (expr: Expr) =>
    steps.find(
      ({ level, title }) =>
        level === "macro" &&
        (title === `Construct ${formatExpression(expr)}` ||
          title === `Place ${formatExpression(expr)}`),
    )?.id ?? rootMacroId;
  const annotations: GeomObject[] = [];
  const addNestedSquare = (
    expr: Extract<Expr, { kind: "pow" }>,
    start: Point2,
    end: Point2,
    side: number,
  ) => {
    if (expr.exponent !== 2) return;
    const baseValue = Math.abs(evaluate(expr.base, values));
    const resultLength = Math.hypot(end.x - start.x, end.y - start.y);
    if (baseValue === 0 || resultLength === 0) return;
    const scale = resultLength / baseValue ** 2;
    const direction = {
      x: (end.x - start.x) / resultLength,
      y: (end.y - start.y) / resultLength,
    };
    const outward = normal(start, end, side);
    const unit = {
      x: start.x + outward.x * scale,
      y: start.y + outward.y * scale,
    };
    const factorOffAxis = {
      x: start.x + outward.x * scale * baseValue,
      y: start.y + outward.y * scale * baseValue,
    };
    const factorOnResult = {
      x: start.x + direction.x * scale * baseValue,
      y: start.y + direction.y * scale * baseValue,
    };
    const stepId = stepFor(expr);
    const metadata = (
      suffix: string,
      role: GeomObject["role"],
      represents: string,
    ) => ({
      id: `figure-square-${suffix}-${annotations.length + 1}`,
      role,
      createdByStepId: stepId,
      usedByStepIds: [rootMacroId],
      represents,
      dependsOnObjectIds: [],
    });
    const unitSegment = segmentObject(
      start,
      unit,
      metadata("unit", "unit", "nested square unit"),
    );
    const offAxisFactor = segmentObject(
      start,
      factorOffAxis,
      metadata("factor-ray", "scaffold", figureLabel(expr.base)),
    );
    const onResultFactor = segmentObject(
      start,
      factorOnResult,
      metadata("factor-result", "intermediate", figureLabel(expr.base)),
    );
    const comparison = segmentObject(
      unit,
      factorOnResult,
      metadata("comparison", "scaffold", "nested square reference connector"),
    );
    const parallel = segmentObject(
      factorOffAxis,
      end,
      metadata("parallel", "active-construction", "nested square parallel"),
    );
    annotations.push(
      unitSegment,
      offAxisFactor,
      onResultFactor,
      comparison,
      parallel,
      pointObject(
        unit,
        metadata("unit-point", "unit", "nested square unit endpoint"),
      ),
      pointObject(
        factorOffAxis,
        metadata(
          "factor-point",
          "active-construction",
          "nested square factor endpoint",
        ),
      ),
      pointObject(
        factorOnResult,
        metadata(
          "result-factor-point",
          "active-construction",
          "nested square factor on result",
        ),
      ),
      labelObject(
        offset(pointAt(start, unit, 0.9), normal(start, unit, -24)),
        "1",
        metadata("unit-label", "unit", "1"),
      ),
      labelObject(
        offset(
          pointAt(start, factorOffAxis, 0.7),
          normal(start, factorOffAxis, 14),
        ),
        figureLabel(expr.base),
        metadata("factor-label", "input", formatExpression(expr.base)),
      ),
      labelObject(
        offset(
          pointAt(start, factorOnResult, 0.72),
          normal(start, factorOnResult, 16 * side),
        ),
        figureLabel(expr.base),
        metadata("result-factor-label", "input", formatExpression(expr.base)),
      ),
    );
  };
  const addPartition = (
    expr: Expr,
    start: Point2,
    end: Point2,
    side: number,
  ) => {
    const { parts, markers } = partition(expr, values);
    const total = parts.reduce((sum, part) => sum + part.value, 0) || 1;
    let consumed = 0;
    const labelOffset = normal(start, end, 17 * side);
    parts.forEach((part, index) => {
      const from = pointAt(start, end, consumed / total);
      consumed += part.value;
      const to = pointAt(start, end, consumed / total);
      const stepId = stepFor(part.expression);
      const segment = segmentObject(from, to, {
        id: `figure-part-${annotations.length + 1}`,
        role: "input",
        createdByStepId: stepId,
        usedByStepIds: [rootMacroId],
        represents: part.label,
        dependsOnObjectIds: [],
      });
      annotations.push(segment);
      const partLabelOffset =
        part.expression.kind === "pow" && part.expression.exponent === 2
          ? normal(start, end, -17 * side)
          : labelOffset;
      annotations.push(
        labelObject(
          offset(pointAt(from, to, 0.5), partLabelOffset),
          part.label,
          {
            id: `figure-label-${annotations.length + 1}`,
            role: "input",
            createdByStepId: stepId,
            usedByStepIds: [rootMacroId],
            represents: part.label,
            dependsOnObjectIds: [segment.id],
          },
        ),
      );
      if (part.expression.kind === "pow")
        addNestedSquare(part.expression, from, to, side);
      if (index < parts.length - 1) {
        const markerExpr =
          markers.find(({ after }) => after === index + 1)?.expression ?? expr;
        annotations.push(
          pointObject(to, {
            id: `figure-node-${annotations.length + 1}`,
            role: "active-construction",
            createdByStepId: stepFor(markerExpr),
            usedByStepIds: [rootMacroId],
            represents: `addition point in ${formatExpression(markerExpr)}`,
            dependsOnObjectIds: [segment.id],
          }),
        );
      }
    });
    if (parts.length > 1)
      annotations.push(
        labelObject(
          offset(
            pointAt(start, end, 0.5),
            normal(
              start,
              end,
              parts.some(
                ({ expression }) =>
                  expression.kind === "pow" && expression.exponent === 2,
              )
                ? -42 * side
                : 35 * side,
            ),
          ),
          figureLabel(expr),
          {
            id: `figure-total-${annotations.length + 1}`,
            role: "intermediate",
            createdByStepId: stepFor(expr),
            usedByStepIds: [rootMacroId],
            represents: formatExpression(expr),
            dependsOnObjectIds: [],
          },
        ),
      );
  };

  const byName = (name: string) =>
    kept.find(({ represents }) => represents === name);
  const position = (name: string) => {
    const object = byName(name);
    return object?.data.kind === "point" ? object.data.position : undefined;
  };
  const rootInputs =
    ast.kind === "sqrt"
      ? [ast.value]
      : ast.kind === "pow"
        ? [ast.base, ast.base]
        : "left" in ast
          ? [ast.left, ast.right]
          : [];
  const origin = position("shared origin");
  const unitEndpoint = position("unit endpoint");
  const first = position("first input endpoint");
  const second = position("second input endpoint");
  if (origin && unitEndpoint) {
    const unitPoint = byName("unit endpoint")!;
    const unitSegment = segmentObject(origin, unitEndpoint, {
      id: "figure-unit",
      role: "unit",
      createdByStepId: unitPoint.createdByStepId,
      usedByStepIds: [rootMacroId],
      represents: "1",
      dependsOnObjectIds: [],
    });
    annotations.push(unitSegment);
    annotations.push(
      labelObject(
        offset(
          pointAt(origin, unitEndpoint, 0.5),
          normal(origin, unitEndpoint, -14),
        ),
        "1",
        {
          id: "figure-unit-label",
          role: "unit",
          createdByStepId: unitPoint.createdByStepId,
          usedByStepIds: [rootMacroId],
          represents: "1",
          dependsOnObjectIds: [unitSegment.id],
        },
      ),
    );
  }
  if (origin && first && rootInputs[0])
    addPartition(rootInputs[0], origin, first, 1);
  if (origin && second && rootInputs[1])
    addPartition(rootInputs[1], origin, second, -1);

  if (ast.kind === "sqrt") {
    const left = position("left endpoint");
    const join = position("unit-radicand join");
    const right = position("right endpoint");
    if (left && join) {
      const unitObject = byName("unit length");
      annotations.push(
        labelObject(
          offset(pointAt(left, join, 0.5), normal(left, join, 16)),
          "1",
          {
            id: "figure-root-unit-label",
            role: "unit",
            createdByStepId: unitObject?.createdByStepId ?? rootMacroId,
            usedByStepIds: [rootMacroId],
            represents: "1",
            dependsOnObjectIds: unitObject ? [unitObject.id] : [],
          },
        ),
      );
    }
    if (join && right) addPartition(ast.value, join, right, 1);
  }

  const constructed =
    position("constructed endpoint") ??
    position("upper semicircle intersection");
  const resultStart = origin ?? position("unit-radicand join");
  if (resultStart && constructed) {
    const resultSide = segmentObject(resultStart, constructed, {
      id: "figure-result",
      role: "result",
      createdByStepId: extractStep?.id ?? rootMacroId,
      usedByStepIds: [],
      represents: formatExpression(ast),
      dependsOnObjectIds: rootMacro.inputObjectIds,
    });
    kept.push(resultSide);
    annotations.push(
      labelObject(
        offset(
          pointAt(resultStart, constructed, 0.62),
          normal(resultStart, constructed, -20),
        ),
        figureLabel(ast),
        {
          id: "figure-result-label",
          role: "result",
          createdByStepId: extractStep?.id ?? rootMacroId,
          usedByStepIds: [],
          represents: formatExpression(ast),
          dependsOnObjectIds: [resultSide.id],
        },
      ),
    );
  } else if (result.data.kind === "segment") {
    kept.push({
      ...result,
      id: "figure-result",
      role: "result",
      dependsOnObjectIds: rootMacro.inputObjectIds,
    });
    addPartition(ast, result.data.start, result.data.end, -1);
  }

  const figureObjects = [...kept, ...annotations];
  const figureIds = new Set(figureObjects.map(({ id }) => id));
  const figureSteps = steps
    .filter(
      (step) => step.level === "macro" || step.parentStepId === rootMacroId,
    )
    .map((step) => {
      const annotationIds = annotations
        .filter(({ createdByStepId }) => createdByStepId === step.id)
        .map(({ id }) => id);
      return {
        ...step,
        inputObjectIds: step.inputObjectIds.filter((id) => figureIds.has(id)),
        outputObjectIds: step.outputObjectIds.filter((id) => figureIds.has(id)),
        createdObjectIds: [
          ...step.createdObjectIds.filter((id) => figureIds.has(id)),
          ...annotationIds,
        ],
      };
    });
  const actionByObject = new Map(
    revealActions
      .filter(({ objectId }) => keptIds.has(objectId))
      .map((action) => [action.objectId, action]),
  );
  const rawActions: RevealAction[] = figureObjects.map((object, index) => ({
    ...(actionByObject.get(object.id) ?? {
      id: `figure-reveal-${index + 1}`,
      animation:
        object.role === "scaffold" ||
        object.role === "ghost" ||
        object.kind === "point" ||
        object.kind === "label"
          ? "fade-in"
          : "draw",
    }),
    stepId: object.createdByStepId,
    objectId: object.id,
    start: 0,
    end: 1,
  }));
  const stepIndex = new Map(figureSteps.map(({ id }, index) => [id, index]));
  const count = Math.max(1, figureSteps.length);
  const groupedActions = new Map<string, RevealAction[]>();
  rawActions.forEach((action) => {
    const group = groupedActions.get(action.stepId) ?? [];
    group.push(action);
    groupedActions.set(action.stepId, group);
  });
  const actions = rawActions.map((action) => {
    const index = stepIndex.get(action.stepId) ?? 0;
    const group = groupedActions.get(action.stepId) ?? [action];
    const within = group.indexOf(action);
    const slice = 1 / count / group.length;
    return {
      ...action,
      start: index / count + within * slice,
      end: index / count + (within + 1) * slice,
    };
  });
  const bounds = geometryBounds(figureObjects);
  const padding = 42;
  return {
    objects: figureObjects,
    steps: figureSteps,
    revealActions: actions,
    viewBox: `${bounds.minX - padding} ${bounds.minY - padding} ${bounds.maxX - bounds.minX + padding * 2} ${bounds.maxY - bounds.minY + padding * 2}`,
  };
}
