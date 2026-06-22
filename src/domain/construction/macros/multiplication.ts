import {
  labelObject,
  pointObject,
  rayObject,
  segmentObject,
  triangleObject,
} from "../../geometry/types";
import type { ConstructionOpKind } from "../types";
import {
  addMacroStep,
  addPrimitive,
  finishMacro,
  metadata,
  point,
  scaledLength,
  type MacroRequest,
} from "./macroTypes";

export const multiplication = (left: number, right: number) => ({
  operation: "mul" as const,
  value: left * right,
  method: "similar-triangle scaling",
  events: ["parallel", "intersection", "result-extraction"],
});

export function generateMultiplication(request: MacroRequest) {
  return generateSimilarTriangles(request, "mul");
}

export function generateSimilarTriangles(
  request: MacroRequest,
  operation: Extract<ConstructionOpKind, "mul" | "div" | "square">,
) {
  const { context, inputs, key, value, y } = request;
  const summary =
    operation === "div"
      ? "Reverse a similar-triangle scale relative to the unit."
      : operation === "square"
        ? "Apply the multiplication template with the same input twice."
        : "Scale the second length by the first relative to the unit.";
  const macro = addMacroStep(request, operation, summary);
  const O = point(475, y + 55);
  const largest = Math.max(
    1,
    Math.abs(inputs[0].value),
    Math.abs(inputs[1].value),
    Math.abs(value),
  );
  const unitScale = Math.max(8, Math.min(48, 430 / largest));
  const U = point(O.x + unitScale, O.y);
  const auxiliaryUnit = point(unitScale * 0.55, -unitScale * 0.8);
  const X =
    operation === "div"
      ? point(
          O.x + auxiliaryUnit.x * inputs[0].value,
          O.y + auxiliaryUnit.y * inputs[0].value,
        )
      : point(O.x + unitScale * inputs[0].value, O.y);
  const Y = point(
    O.x + auxiliaryUnit.x * inputs[1].value,
    O.y + auxiliaryUnit.y * inputs[1].value,
  );
  const Z =
    operation === "div"
      ? point(O.x + unitScale * value, O.y)
      : point(O.x + auxiliaryUnit.x * value, O.y + auxiliaryUnit.y * value);
  const makePoint = (
    name: string,
    position: typeof O,
    role: "unit" | "scaffold" | "active-construction",
    deps: string[],
  ) =>
    pointObject(position, {
      ...metadata(context.ids.next("point"), role, macro, name, deps),
    });
  const o = makePoint("shared origin", O, "scaffold", []);
  const u = makePoint("unit endpoint", U, "unit", []);
  const x = makePoint("first input endpoint", X, "scaffold", [inputs[0].id]);
  const yPoint = makePoint("second input endpoint", Y, "scaffold", [
    inputs[1].id,
  ]);
  const baseline = rayObject(
    O,
    point(Math.max(695, X.x + 45), O.y),
    metadata(context.ids.next("ray"), "scaffold", macro, "main ray", [o.id]),
  );
  const auxiliary = rayObject(
    O,
    point(
      O.x + auxiliaryUnit.x * largest * 1.25,
      O.y + auxiliaryUnit.y * largest * 1.25,
    ),
    metadata(context.ids.next("ray"), "scaffold", macro, "auxiliary ray", [
      o.id,
    ]),
  );
  addPrimitive(
    context,
    macro,
    "Lay out the scale",
    "Place the unit and input lengths on two rays from a shared origin.",
    inputs.map(({ id }) => id),
    [baseline, auxiliary, o, u, x, yPoint],
    "fade-in",
  );
  const comparison = segmentObject(
    U,
    Y,
    metadata(
      context.ids.next("line"),
      "scaffold",
      macro,
      "reference connector",
      [u.id, yPoint.id],
    ),
  );
  const parallel = segmentObject(
    X,
    Z,
    metadata(
      context.ids.next("parallel"),
      "active-construction",
      macro,
      "parallel through the first input",
      [x.id, comparison.id],
    ),
  );
  addPrimitive(
    context,
    macro,
    "Draw the parallel",
    "Connect the reference lengths, then draw a parallel through the other input.",
    [u.id, yPoint.id, x.id],
    [comparison, parallel],
  );
  const z = makePoint("constructed endpoint", Z, "active-construction", [
    parallel.id,
    operation === "div" ? baseline.id : auxiliary.id,
  ]);
  const referenceTriangle = triangleObject(
    [O, U, Y],
    metadata(
      context.ids.next("triangle"),
      "proof-highlight",
      macro,
      "reference triangle",
      [o.id, u.id, yPoint.id],
    ),
  );
  const resultTriangle = triangleObject(
    [O, X, Z],
    metadata(
      context.ids.next("triangle"),
      "proof-highlight",
      macro,
      "result triangle",
      [o.id, x.id, z.id],
    ),
  );
  addPrimitive(
    context,
    macro,
    "Choose the constructed length",
    "Use the intersection of the parallel and the target ray.",
    [parallel.id, auxiliary.id],
    [z, referenceTriangle, resultTriangle],
    "select",
  );
  const endX = 65 + (value < 0 ? -1 : 1) * scaledLength(value);
  const result = segmentObject(
    point(65, y),
    point(endX, y),
    metadata(context.ids.next("segment"), "intermediate", macro, key, [
      inputs[0].id,
      inputs[1].id,
      z.id,
    ]),
  );
  const label = labelObject(
    point((65 + endX) / 2, y - 13),
    key,
    metadata(context.ids.next("label"), "intermediate", macro, key, [
      result.id,
    ]),
  );
  addPrimitive(
    context,
    macro,
    "Extract the result",
    "Transfer the constructed auxiliary length to the result line.",
    [z.id],
    [result, label],
  );
  return finishMacro(request, macro, result);
}
