import type { ConstructionContext } from "../ConstructionContext";
import type { ConstructionOpKind, OperationProof } from "../types";
import type { GeomObject, GeomRole, Point2 } from "../../geometry/types";

export type ConstructedValue = {
  id: string;
  value: number;
  object: GeomObject;
};

export type MacroRequest = {
  context: ConstructionContext;
  key: string;
  value: number;
  inputs: ConstructedValue[];
  y: number;
  proof?: OperationProof;
};

export const metadata = (
  id: string,
  role: GeomRole,
  step: string,
  represents: string,
  dependencies: string[] = [],
) => ({
  id,
  role,
  createdByStepId: step,
  usedByStepIds: [],
  dependsOnObjectIds: dependencies,
  represents,
});

export const scaledLength = (value: number) =>
  Math.max(24, Math.min(250, Math.abs(value) * 30));

export function addPrimitive(
  context: ConstructionContext,
  parentStepId: string,
  title: string,
  summary: string,
  inputs: string[],
  created: GeomObject[],
  animation: "draw" | "fade-in" | "pulse" | "select" = "draw",
) {
  const id = context.ids.next("primitive");
  created.forEach((object) => {
    object.createdByStepId = id;
    context.addObject(object);
    const revealAnimation =
      object.role === "scaffold" || object.role === "ghost"
        ? "fade-in"
        : object.kind === "point" || object.kind === "label"
          ? animation === "draw"
            ? "fade-in"
            : animation
          : animation;
    context.revealObject(object.id, id, revealAnimation);
  });
  context.addStep({
    id,
    parentStepId,
    level: "primitive",
    title,
    summary,
    inputObjectIds: inputs,
    outputObjectIds: created.map(({ id: objectId }) => objectId),
    createdObjectIds: created.map(({ id: objectId }) => objectId),
  });
  return id;
}

export function addMacroStep(
  request: MacroRequest,
  operation: ConstructionOpKind,
  summary: string,
) {
  const id = request.context.ids.next("step");
  request.context.addStep({
    id,
    level: "macro",
    title: `Construct ${request.key}`,
    summary,
    operation,
    inputObjectIds: request.inputs.map(({ id: inputId }) => inputId),
    outputObjectIds: [],
    createdObjectIds: [],
    proofId: request.proof?.id,
  });
  return id;
}

export const point = (x: number, y: number): Point2 => ({ x, y });

export function finishMacro(
  request: MacroRequest,
  macroStepId: string,
  result: GeomObject,
) {
  if (!request.context.objects.some(({ id }) => id === result.id))
    request.context.addObject(result);
  request.context.values.set(request.key, result);
  const step = request.context.steps.find(({ id }) => id === macroStepId)!;
  step.outputObjectIds = [result.id];
  step.createdObjectIds = request.context.objects
    .filter(
      ({ createdByStepId }) =>
        request.context.steps.find(({ id }) => id === createdByStepId)
          ?.parentStepId === macroStepId,
    )
    .map(({ id }) => id);
  if (request.proof) {
    const related = [
      ...request.inputs.map(({ id }) => id),
      ...step.createdObjectIds,
      result.id,
    ];
    request.context.addProof({
      ...request.proof,
      claims: request.proof.claims.map((claim) => ({
        ...claim,
        highlightObjectIds: related,
      })),
    });
  }
  return { id: result.id, value: request.value, object: result };
}
