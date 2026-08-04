import type { Point2 } from "../geometry/types";
import type { FoldRenderAction, RenderDocumentV2 } from "../render/types";

export type OrigamiObjectTimelineState = {
  visible: boolean;
  opacity: number;
  drawProgress: number;
  points?: Point2[];
  layer?: number;
  side?: "front" | "back";
  folding: boolean;
};

export const clampTime = (time: number, duration: number) =>
  Math.max(0, Math.min(duration, Number.isFinite(time) ? time : 0));

const progressAt = (time: number, start: number, end: number) =>
  end === start ? Number(time >= end) : Math.max(0, Math.min(1, (time - start) / (end - start)));

const interpolatePoints = (from: Point2[], to: Point2[], progress: number) =>
  from.map((point, index) => ({
    x: point.x + ((to[index]?.x ?? point.x) - point.x) * progress,
    y: point.y + ((to[index]?.y ?? point.y) - point.y) * progress,
  }));

export function timelineBoundaries(document: RenderDocumentV2): number[] {
  return [...new Set([0, document.metadata.duration, ...document.revealActions.flatMap(({ start, end }) => [start, end])])]
    .filter((time) => time >= 0 && time <= document.metadata.duration)
    .sort((a, b) => a - b);
}

export function adjacentBoundary(document: RenderDocumentV2, time: number, direction: -1 | 1): number {
  const boundaries = timelineBoundaries(document);
  const epsilon = 1e-6;
  if (direction > 0) return boundaries.find((boundary) => boundary > time + epsilon) ?? document.metadata.duration;
  return [...boundaries].reverse().find((boundary) => boundary < time - epsilon) ?? 0;
}

export function evaluateOrigamiTimeline(
  document: RenderDocumentV2,
  requestedTime: number,
): Record<string, OrigamiObjectTimelineState> {
  const time = clampTime(requestedTime, document.metadata.duration);
  const result: Record<string, OrigamiObjectTimelineState> = {};
  for (const object of document.objects) {
    const data = object.data;
    result[object.id] = {
      visible: false,
      opacity: 0,
      drawProgress: 0,
      points: data.kind === "polygon" ? data.points : undefined,
      layer: data.kind === "polygon" ? data.layer : undefined,
      side: data.kind === "polygon" ? data.side : undefined,
      folding: false,
    };
  }

  for (const object of document.objects) {
    const state = result[object.id];
    const presentationActions = document.revealActions.filter(
      (action) => action.objectId === object.id && action.animation !== "fold" && action.animation !== "unfold",
    );
    if (presentationActions.length === 0) {
      state.visible = true;
      state.opacity = 1;
      state.drawProgress = 1;
    }
    for (const action of presentationActions) {
      const local = progressAt(time, action.start, action.end);
      if (action.animation === "fade-out") {
        state.visible = time < action.end;
        state.opacity = 1 - local;
      } else {
        state.visible ||= time >= action.start;
        state.opacity = Math.max(state.opacity, local);
        state.drawProgress = Math.max(state.drawProgress, action.animation === "draw" ? local : Number(time >= action.start));
      }
    }
  }

  const folds = document.revealActions
    .filter((action): action is FoldRenderAction => action.animation === "fold" || action.animation === "unfold")
    .sort((a, b) => a.start - b.start);
  for (const action of folds) {
    if (time < action.start) continue;
    const state = result[action.objectId];
    if (!state?.points) continue;
    const local = progressAt(time, action.start, action.end);
    state.points = interpolatePoints(state.points, action.targetPoints, local);
    state.folding = local > 0 && local < 1;
    if (local === 1) {
      state.layer = action.targetLayer ?? state.layer;
      state.side = action.targetSide ?? state.side;
    }
  }
  return result;
}
