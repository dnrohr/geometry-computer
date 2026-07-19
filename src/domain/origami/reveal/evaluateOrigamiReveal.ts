import type { OrigamiRevealAction } from "../types";

export type OrigamiObjectRevealState = {
  visible: boolean;
  drawProgress: number;
  opacity: number;
  highlighted: boolean;
  dimmed: boolean;
  future: boolean;
};

export const clampOrigamiProgress = (value: number) =>
  Math.max(0, Math.min(1, value));

export function evaluateOrigamiReveal(
  actions: OrigamiRevealAction[],
  progress: number,
): Record<string, OrigamiObjectRevealState> {
  const p = clampOrigamiProgress(progress);
  const result: Record<string, OrigamiObjectRevealState> = {};
  for (const action of actions) {
    const local =
      action.end === action.start
        ? Number(p >= action.end)
        : clampOrigamiProgress(
            (p - action.start) / (action.end - action.start),
          );
    const state = result[action.objectId] ?? {
      visible: false,
      drawProgress: 0,
      opacity: 0,
      highlighted: false,
      dimmed: false,
      future: false,
    };
    if (action.animation === "fade-out") {
      state.visible = p < action.end;
      state.opacity = 1 - local;
      state.drawProgress = 1;
    } else if (action.animation === "dim") {
      if (p < action.end) {
        state.visible = true;
        state.opacity = 0.12;
        state.drawProgress = 1;
        state.future = true;
      }
    } else {
      if (p >= action.start || !state.future) {
        state.visible = p >= action.start;
        state.opacity = local;
        state.drawProgress =
          action.animation === "draw" ? local : state.visible ? 1 : 0;
        state.future = false;
      }
    }
    state.highlighted ||=
      action.animation === "highlight" && local > 0 && local < 1;
    state.dimmed ||= action.animation === "dim" && p >= action.start;
    result[action.objectId] = state;
  }
  return result;
}
