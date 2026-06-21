import {
  arcObject,
  labelObject,
  pointObject,
  segmentObject,
} from "../../geometry/types";
import { ConstructionError } from "../ConstructionContext";
import {
  addMacroStep,
  addPrimitive,
  finishMacro,
  metadata,
  point,
  scaledLength,
  type MacroRequest,
} from "./macroTypes";

export function squareRoot(value: number) {
  if (value < 0)
    throw new ConstructionError(
      "A negative length has no real square root construction.",
      "NEGATIVE_SQUARE_ROOT",
    );
  return {
    operation: "sqrt" as const,
    value: Math.sqrt(value),
    method: "semicircle geometric mean",
    events: ["semicircle", "perpendicular", "intersection", "positive-branch"],
  };
}

export function generateSquareRoot(request: MacroRequest) {
  if (request.inputs[0].value < 0)
    throw new ConstructionError(
      "A negative length has no real square root construction.",
      "NEGATIVE_SQUARE_ROOT",
    );
  const { context, inputs, key, value, y } = request;
  const macro = addMacroStep(
    request,
    "sqrt",
    "Construct the geometric mean of unit length and the radicand.",
  );
  const A = point(465, y + 50);
  const unitLength = 45;
  const xLength = Math.min(150, scaledLength(inputs[0].value));
  const B = point(A.x + unitLength, A.y);
  const C = point(B.x + xLength, A.y);
  const center = point((A.x + C.x) / 2, A.y);
  const radius = (C.x - A.x) / 2;
  const height = Math.sqrt(unitLength * xLength);
  const D = point(B.x, A.y - height);
  const namedPoint = (name: string, position: typeof A, deps: string[]) =>
    pointObject(position, {
      ...metadata(context.ids.next("point"), "scaffold", macro, name, deps),
      label: name,
    });
  const a = namedPoint("A", A, []);
  const b = namedPoint("B", B, [inputs[0].id]);
  const c = namedPoint("C", C, [inputs[0].id]);
  const unit = segmentObject(
    A,
    B,
    metadata(context.ids.next("unit"), "unit", macro, "AB = 1"),
  );
  const radicand = segmentObject(
    B,
    C,
    metadata(context.ids.next("radicand"), "scaffold", macro, "BC = x", [
      inputs[0].id,
    ]),
  );
  addPrimitive(
    context,
    macro,
    "Place 1 and x consecutively",
    "Set AB = 1 and BC = x on one line.",
    [inputs[0].id],
    [a, b, c, unit, radicand],
  );
  const semicircle = arcObject(
    center,
    radius,
    180,
    360,
    metadata(
      context.ids.next("semicircle"),
      "scaffold",
      macro,
      "semicircle on AC",
      [a.id, c.id],
    ),
  );
  addPrimitive(
    context,
    macro,
    "Draw the semicircle",
    "Use AC as the diameter.",
    [a.id, c.id],
    [semicircle],
  );
  const perpendicular = segmentObject(
    B,
    point(B.x, A.y - radius - 15),
    metadata(
      context.ids.next("perpendicular"),
      "active-construction",
      macro,
      "perpendicular at B",
      [b.id],
    ),
  );
  const d = pointObject(D, {
    ...metadata(
      context.ids.next("intersection"),
      "active-construction",
      macro,
      "selected positive intersection D",
      [perpendicular.id, semicircle.id],
    ),
    label: "D",
  });
  addPrimitive(
    context,
    macro,
    "Select intersection D",
    "Erect the perpendicular at B and choose its nonnegative intersection.",
    [b.id, semicircle.id],
    [perpendicular, d],
    "select",
  );
  const endX = 65 + scaledLength(value);
  const result = segmentObject(
    point(65, y),
    point(endX, y),
    metadata(context.ids.next("segment"), "intermediate", macro, key, [
      inputs[0].id,
      d.id,
    ]),
  );
  const label = labelObject(
    point((65 + endX) / 2, y - 13),
    `${key} = ${Number(value.toFixed(4))}`,
    metadata(context.ids.next("label"), "intermediate", macro, key, [
      result.id,
    ]),
  );
  addPrimitive(
    context,
    macro,
    "Extract BD",
    "Transfer the altitude BD to the result line.",
    [b.id, d.id],
    [result, label],
  );
  return finishMacro(request, macro, result);
}
