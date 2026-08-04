import type { RenderDocumentV2, RenderObject } from "../render/types";
import {
  add,
  dot,
  linePolygonSegment,
  normalize,
  scale,
  subtract,
} from "./geometry";
import type { FlatFoldResult, OrientedLine } from "./types";

export type FoldPresentationOptions = {
  sourcePoint?: { x: number; y: number };
  targetPoint?: { x: number; y: number };
  targetLine?: OrientedLine;
  pauseBefore?: number;
  pauseAfter?: number;
  unfold?: boolean;
};

const bounds = (points: { x: number; y: number }[]) => {
  const xs = points.map(({ x }) => x);
  const ys = points.map(({ y }) => y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const padding = Math.max(maxX - minX, maxY - minY) * 0.12 || 1;
  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + 2 * padding,
    height: maxY - minY + 2 * padding,
  };
};

export function compileFlatFoldDocument(
  result: FlatFoldResult,
  title = "Computed flat fold",
  options: FoldPresentationOptions = {},
): RenderDocumentV2 {
  const stepId = "fold-1";
  const creaseId = result.after.creases.at(-1)?.id ?? "crease-1";
  const creasePoints = result.before.faces.flatMap(({ points }) => {
    try {
      return linePolygonSegment(result.crease, points);
    } catch {
      return [];
    }
  });
  creasePoints.sort(
    (a, b) =>
      dot(subtract(a, result.crease.point), result.crease.direction) -
      dot(subtract(b, result.crease.point), result.crease.direction),
  );
  if (creasePoints.length < 2)
    throw new Error("The crease does not cross the current paper model.");
  const creaseSegment = [
    creasePoints[0],
    creasePoints[creasePoints.length - 1],
  ] as const;
  const annotations: RenderObject[] = [];
  if (options.sourcePoint && options.targetPoint) {
    const motion = normalize(
      subtract(options.targetPoint, options.sourcePoint),
    );
    const labelOffset = scale({ x: -motion.y, y: motion.x }, 0.65);
    annotations.push(
      {
        id: "fold-source",
        kind: "point",
        role: "proof-highlight",
        createdByStepId: stepId,
        usedByStepIds: [stepId],
        dependsOnObjectIds: [],
        data: { kind: "point", position: options.sourcePoint },
      },
      {
        id: "fold-target",
        kind: "point",
        role: "result",
        createdByStepId: stepId,
        usedByStepIds: [stepId],
        dependsOnObjectIds: [],
        data: { kind: "point", position: options.targetPoint },
      },
      {
        id: "fold-motion",
        kind: "arrow",
        role: "reference",
        createdByStepId: stepId,
        usedByStepIds: [stepId],
        dependsOnObjectIds: ["fold-source", "fold-target"],
        data: {
          kind: "arrow",
          start: options.sourcePoint,
          end: options.targetPoint,
        },
      },
      {
        id: "fold-source-label",
        kind: "label",
        role: "proof-highlight",
        createdByStepId: stepId,
        usedByStepIds: [stepId],
        dependsOnObjectIds: ["fold-source"],
        data: {
          kind: "label",
          position: add(options.sourcePoint, labelOffset),
          text: "source",
        },
      },
      {
        id: "fold-target-label",
        kind: "label",
        role: "result",
        createdByStepId: stepId,
        usedByStepIds: [stepId],
        dependsOnObjectIds: ["fold-target"],
        data: {
          kind: "label",
          position: add(options.targetPoint, scale(labelOffset, -1)),
          text: "target",
        },
      },
    );
  }
  if (options.targetLine) {
    const segments = result.before.faces.flatMap(({ points }) => {
      try {
        return linePolygonSegment(options.targetLine!, points);
      } catch {
        return [];
      }
    });
    if (segments.length >= 2)
      annotations.push({
        id: "fold-target-line",
        kind: "segment",
        role: "input",
        createdByStepId: stepId,
        usedByStepIds: [stepId],
        dependsOnObjectIds: [],
        data: {
          kind: "segment",
          start: segments[0],
          end: segments[segments.length - 1],
        },
      });
  }
  const objects: RenderObject[] = [
    ...result.stationaryFaces.map((face) => ({
      id: face.id,
      kind: "polygon" as const,
      role: "paper" as const,
      createdByStepId: stepId,
      usedByStepIds: [],
      dependsOnObjectIds: [],
      data: {
        kind: "polygon" as const,
        points: face.points,
        layer: face.layer,
        side: face.side,
      },
    })),
    ...result.movingFaces.map(({ source }) => ({
      id: source.id,
      kind: "polygon" as const,
      role: "paper" as const,
      createdByStepId: stepId,
      usedByStepIds: [stepId],
      dependsOnObjectIds: [],
      data: {
        kind: "polygon" as const,
        points: source.points,
        layer: source.layer,
        side: source.side,
      },
    })),
    {
      id: creaseId,
      kind: "crease",
      role: "crease",
      createdByStepId: stepId,
      usedByStepIds: [],
      dependsOnObjectIds: result.movingFaces.map(({ source }) => source.id),
      data: { kind: "crease", start: creaseSegment[0], end: creaseSegment[1] },
    },
    ...annotations,
  ];
  const allPoints = [
    ...result.before.faces.flatMap(({ points }) => points),
    ...result.movingFaces.flatMap(({ target }) => target.points),
    ...(options.sourcePoint ? [options.sourcePoint] : []),
    ...(options.targetPoint ? [options.targetPoint] : []),
  ];
  const box = bounds(allPoints);
  const pauseBefore = Math.max(0, options.pauseBefore ?? 0.4);
  const pauseAfter = Math.max(0, options.pauseAfter ?? 0.3);
  const foldStart = 0.6 + pauseBefore;
  const foldEnd = foldStart + 2.1;
  const creaseStart = foldEnd + pauseAfter;
  const creaseEnd = creaseStart + 0.8;
  const unfoldStart = creaseEnd + pauseAfter;
  const unfoldEnd = unfoldStart + 2.1;
  const revealActions: RenderDocumentV2["revealActions"] = [
    ...objects
      .filter(({ kind }) => kind === "polygon")
      .map((object, index) => ({
        id: `reveal-${index + 1}`,
        stepId,
        objectId: object.id,
        start: 0,
        end: 0.6,
        animation: "fade-in" as const,
      })),
    ...annotations.map((object, index) => ({
      id: `reveal-annotation-${index + 1}`,
      stepId,
      objectId: object.id,
      start: 0.1,
      end: 0.6,
      animation:
        object.kind === "arrow" ? ("draw" as const) : ("fade-in" as const),
    })),
    ...result.movingFaces.map(({ source, target }, index) => ({
      id: `fold-${index + 1}`,
      stepId,
      objectId: source.id,
      creaseObjectId: creaseId,
      movingSide: result.movingSide,
      targetPoints: target.points,
      targetLayer: target.layer,
      targetSide: target.side,
      start: foldStart,
      end: foldEnd,
      animation: "fold" as const,
    })),
    {
      id: "reveal-crease",
      stepId,
      objectId: creaseId,
      start: creaseStart,
      end: creaseEnd,
      animation: "draw",
    },
    ...(options.unfold
      ? result.movingFaces.map(({ source }, index) => ({
          id: `unfold-${index + 1}`,
          stepId,
          objectId: source.id,
          creaseObjectId: creaseId,
          movingSide: result.movingSide,
          targetPoints: source.points,
          targetLayer: source.layer,
          targetSide: source.side,
          start: unfoldStart,
          end: unfoldEnd,
          animation: "unfold" as const,
        }))
      : []),
  ];
  const duration = options.unfold ? unfoldEnd : creaseEnd;
  return {
    version: 2,
    metadata: {
      schema: "geometry-computer/render-document",
      generator: { name: "geometry-computer", version: "0.1.0" },
      title,
      narration: `${title}. Fold the ${result.movingSide} side across the computed crease.`,
      aspectRatio: { width: box.width, height: box.height },
      theme: "geometry-computer-paper",
      duration,
    },
    expression: title,
    simplifiedExpression: "computed flat fold",
    values: {},
    viewBox: `${box.x} ${box.y} ${box.width} ${box.height}`,
    objects,
    steps: [
      {
        id: stepId,
        level: "macro",
        title,
        summary: "Reflect the selected paper faces across the computed crease.",
        inputObjectIds: result.movingFaces.map(({ source }) => source.id),
        outputObjectIds: [creaseId],
        createdObjectIds: objects.map(({ id }) => id),
      },
    ],
    revealActions,
    proofs: [],
  };
}
