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

export const addition = (left: number, right: number) => ({
  operation: "add" as const,
  value: left + right,
  directed: false,
  method: "consecutive segment transfer",
});

export function generateAddition(request: MacroRequest) {
  const { context, inputs, key, value, y } = request;
  const macro = addMacroStep(
    request,
    "add",
    "Transfer the second segment after the first.",
  );
  const origin = point(65, y);
  const join = point(origin.x + scaledLength(inputs[0].value), y);
  const end = point(join.x + scaledLength(inputs[1].value), y);
  const joinPoint = pointObject(
    join,
    metadata(context.ids.next("point"), "scaffold", macro, "transfer join", [
      inputs[0].id,
    ]),
  );
  addPrimitive(
    context,
    macro,
    "Lay off the first length",
    "Mark the endpoint of the first directed segment.",
    [inputs[0].id],
    [joinPoint],
    "pulse",
  );
  const copy = segmentObject(
    join,
    end,
    metadata(
      context.ids.next("transfer"),
      "active-construction",
      macro,
      "copied second segment",
      [inputs[1].id, joinPoint.id],
    ),
  );
  addPrimitive(
    context,
    macro,
    "Transfer the second length",
    "Copy the second segment from the first endpoint.",
    [inputs[1].id, joinPoint.id],
    [copy],
  );
  const result = segmentObject(
    origin,
    end,
    metadata(context.ids.next("segment"), "intermediate", macro, key, [
      inputs[0].id,
      inputs[1].id,
      copy.id,
    ]),
  );
  const label = labelObject(
    point((origin.x + end.x) / 2, y - 13),
    `${key} = ${Number(value.toFixed(4))}`,
    metadata(context.ids.next("label"), "intermediate", macro, key, [
      result.id,
    ]),
  );
  addPrimitive(
    context,
    macro,
    "Mark the sum",
    "The full displacement is the sum of the consecutive lengths.",
    [copy.id, joinPoint.id],
    [result, label],
  );
  return finishMacro(request, macro, result);
}
