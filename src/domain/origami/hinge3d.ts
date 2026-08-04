import type { Point2 } from "../geometry/types";
import type { FoldRenderAction, RenderDocumentV2 } from "../render/types";

export type Point3 = Point2 & { z: number };
export type HingeState = {
  points: Point3[];
  side?: "front" | "back";
  layer?: number;
  rotating: boolean;
};

const localProgress = (time: number, action: FoldRenderAction) =>
  action.end === action.start
    ? Number(time >= action.end)
    : Math.max(
        0,
        Math.min(1, (time - action.start) / (action.end - action.start)),
      );

function rotateAroundCrease(
  point: Point2,
  start: Point2,
  end: Point2,
  angle: number,
): Point3 {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  const ux = dx / length;
  const uy = dy / length;
  const px = point.x - start.x;
  const py = point.y - start.y;
  const along = px * ux + py * uy;
  const perpendicular = -px * uy + py * ux;
  const foldedPerpendicular = perpendicular * Math.cos(angle);
  return {
    x: start.x + along * ux - foldedPerpendicular * uy,
    y: start.y + along * uy + foldedPerpendicular * ux,
    z: perpendicular * Math.sin(angle),
  };
}

export function evaluateHingeObject(
  document: RenderDocumentV2,
  objectId: string,
  time: number,
): HingeState | undefined {
  const object = document.objects.find(({ id }) => id === objectId);
  if (!object || object.data.kind !== "polygon") return undefined;
  let flat = object.data.points;
  let side = object.data.side;
  let layer = object.data.layer;
  const actions = document.revealActions
    .filter(
      (action): action is FoldRenderAction =>
        action.objectId === objectId &&
        (action.animation === "fold" || action.animation === "unfold"),
    )
    .sort((a, b) => a.start - b.start);
  for (const action of actions) {
    if (time < action.start) break;
    const progress = localProgress(time, action);
    const crease = document.objects.find(
      ({ id }) => id === action.creaseObjectId,
    );
    if (!crease || crease.data.kind !== "crease") continue;
    const creaseData = crease.data;
    if (progress < 1) {
      const direction = action.movingSide === "left" ? 1 : -1;
      const unfolding = action.animation === "unfold" ? -1 : 1;
      return {
        points: flat.map((point) =>
          rotateAroundCrease(
            point,
            creaseData.start,
            creaseData.end,
            Math.PI * progress * direction * unfolding,
          ),
        ),
        side: progress >= 0.5 ? (action.targetSide ?? side) : side,
        layer,
        rotating: progress > 0,
      };
    }
    flat = action.targetPoints;
    side = action.targetSide ?? side;
    layer = action.targetLayer ?? layer;
  }
  return {
    points: flat.map((point) => ({ ...point, z: 0 })),
    side,
    layer,
    rotating: false,
  };
}
