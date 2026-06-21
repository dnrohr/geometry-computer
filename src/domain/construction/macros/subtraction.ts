import { labelObject, pointObject, segmentObject } from "../../geometry/types";
import {
  addMacroStep,
  addPrimitive,
  finishMacro,
  metadata,
  point,
  scaledLength,
  type MacroRequest,
} from "./macroTypes";

export const subtraction = (left: number, right: number) => ({
  operation: "sub" as const,
  value: left - right,
  directed: left - right < 0,
  method: "opposite directed transfer",
});

export function generateSubtraction(request: MacroRequest) {
  const { context, inputs, key, value, y } = request;
  const macro = addMacroStep(
    request,
    "sub",
    "Transfer the second segment backward from the first endpoint.",
  );
  const origin = point(170, y);
  const firstEnd = point(origin.x + scaledLength(inputs[0].value), y);
  const direction = value < 0 ? -1 : 1;
  const resultEnd = point(origin.x + direction * scaledLength(value), y);
  const firstPoint = pointObject(
    firstEnd,
    metadata(context.ids.next("point"), "scaffold", macro, "first endpoint", [
      inputs[0].id,
    ]),
  );
  addPrimitive(
    context,
    macro,
    "Mark the minuend",
    "Locate the endpoint of the first length.",
    [inputs[0].id],
    [firstPoint],
    "pulse",
  );
  const backward = segmentObject(
    firstEnd,
    resultEnd,
    metadata(
      context.ids.next("transfer"),
      "active-construction",
      macro,
      "backward transfer",
      [inputs[1].id, firstPoint.id],
    ),
  );
  addPrimitive(
    context,
    macro,
    "Transfer backward",
    "Copy the subtrahend in the negative direction.",
    [inputs[1].id, firstPoint.id],
    [backward],
  );
  const result = segmentObject(
    origin,
    resultEnd,
    metadata(context.ids.next("segment"), "intermediate", macro, key, [
      inputs[0].id,
      inputs[1].id,
      backward.id,
    ]),
  );
  const label = labelObject(
    point((origin.x + resultEnd.x) / 2, y - 13),
    `${key} = ${Number(value.toFixed(4))}`,
    metadata(context.ids.next("label"), "intermediate", macro, key, [
      result.id,
    ]),
  );
  addPrimitive(
    context,
    macro,
    "Mark the difference",
    value < 0
      ? "The endpoint lies left of the origin, so the result is negative."
      : "The remaining directed displacement is the difference.",
    [backward.id],
    [result, label],
  );
  return finishMacro(request, macro, result);
}
