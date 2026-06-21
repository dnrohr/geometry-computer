import type { ConstructionStep } from "../../domain/construction/types";
import type { GeomObject } from "../../domain/geometry/types";
export type InteractionState = {
  activeStepId?: string;
  hoveredObjectId?: string;
  selectedObjectId?: string;
  hoveredStepId?: string;
  selectedStepId?: string;
};
export const initialInteractionState: InteractionState = {};
export function highlightedObjectIds(
  state: InteractionState,
  steps: ConstructionStep[],
  objects: GeomObject[],
) {
  const ids = new Set<string>();
  const stepId =
    state.hoveredStepId ?? state.selectedStepId ?? state.activeStepId;
  const step = steps.find(({ id }) => id === stepId);
  if (step)
    [
      ...step.inputObjectIds,
      ...step.outputObjectIds,
      ...step.createdObjectIds,
    ].forEach((id) => ids.add(id));
  const object = objects.find(
    ({ id }) => id === (state.hoveredObjectId ?? state.selectedObjectId),
  );
  if (object) ids.add(object.id);
  return ids;
}
export function highlightedStepIds(
  state: InteractionState,
  objects: GeomObject[],
) {
  const object = objects.find(
    ({ id }) => id === (state.hoveredObjectId ?? state.selectedObjectId),
  );
  return new Set(
    [
      state.hoveredStepId,
      state.selectedStepId,
      object?.createdByStepId,
      ...(object?.usedByStepIds ?? []),
    ].filter(Boolean) as string[],
  );
}
