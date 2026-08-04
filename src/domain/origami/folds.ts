import type { Point2 } from "../geometry/types";
import {
  ORIGAMI_EPSILON,
  add,
  distance,
  dot,
  leftNormal,
  lineThrough,
  normalize,
  projectPointToLine,
  scale,
  signedDistanceToLine,
  subtract,
} from "./geometry";
import {
  OrigamiError,
  type FoldBranch,
  type FoldSolution,
  type OrientedLine,
} from "./types";

export function foldPointToPoint(source: Point2, target: Point2): OrientedLine {
  if (distance(source, target) <= ORIGAMI_EPSILON)
    throw new OrigamiError(
      "Coincident points do not determine one crease.",
      "COINCIDENT_POINTS",
    );
  const midpoint = scale(add(source, target), 0.5);
  const sourceToTarget = subtract(target, source);
  return lineThrough(midpoint, { x: -sourceToTarget.y, y: sourceToTarget.x });
}

type ImplicitLine = { normal: Point2; offset: number };
const implicit = (line: OrientedLine): ImplicitLine => {
  const normal = leftNormal(line);
  return { normal, offset: -dot(normal, line.point) };
};
const implicitIntersection = (
  first: ImplicitLine,
  second: ImplicitLine,
): Point2 | null => {
  const determinant =
    first.normal.x * second.normal.y - second.normal.x * first.normal.y;
  if (Math.abs(determinant) <= ORIGAMI_EPSILON) return null;
  return {
    x:
      (-first.offset * second.normal.y + second.offset * first.normal.y) /
      determinant,
    y:
      (-first.normal.x * second.offset + second.normal.x * first.offset) /
      determinant,
  };
};

export function foldLineToLine(
  source: OrientedLine,
  target: OrientedLine,
  branch: FoldBranch,
): OrientedLine {
  const first = implicit(source);
  const second = implicit(target);
  const intersection = implicitIntersection(first, second);
  if (!intersection) {
    if (Math.abs(signedDistanceToLine(target.point, source)) <= ORIGAMI_EPSILON)
      throw new OrigamiError(
        "Coincident lines do not determine one crease.",
        "COINCIDENT_LINES",
      );
    const midway = scale(
      add(source.point, projectPointToLine(source.point, target)),
      0.5,
    );
    return lineThrough(midway, source.direction);
  }
  const sourceDirection = normalize(source.direction);
  let targetDirection = normalize(target.direction);
  if (dot(sourceDirection, targetDirection) < 0)
    targetDirection = scale(targetDirection, -1);
  const direction =
    branch === "internal"
      ? add(sourceDirection, targetDirection)
      : subtract(sourceDirection, targetDirection);
  return lineThrough(intersection, direction);
}

export const foldThroughPoint = (point: Point2, direction: Point2) =>
  lineThrough(point, direction);

function lineCircleIntersections(
  line: OrientedLine,
  center: Point2,
  radius: number,
): Point2[] {
  const projection = projectPointToLine(center, line);
  const distanceToLine = distance(center, projection);
  if (distanceToLine > radius + ORIGAMI_EPSILON) return [];
  const offset = Math.sqrt(
    Math.max(0, radius * radius - distanceToLine * distanceToLine),
  );
  if (offset <= ORIGAMI_EPSILON) return [projection];
  return [
    add(projection, scale(line.direction, offset)),
    add(projection, scale(line.direction, -offset)),
  ];
}

/** Huzita-Hatori O5: creases through `through` that place source on targetLine. */
export function foldPointToLineThroughPoint(
  source: Point2,
  targetLine: OrientedLine,
  through: Point2,
): OrientedLine[] {
  const targets = lineCircleIntersections(
    targetLine,
    through,
    distance(source, through),
  );
  const creases = targets
    .filter((target) => distance(source, target) > ORIGAMI_EPSILON)
    .map((target) => foldPointToPoint(source, target))
    .filter(
      (crease) => Math.abs(signedDistanceToLine(through, crease)) <= 1e-7,
    );
  if (!creases.length)
    throw new OrigamiError(
      "No real crease satisfies the point-to-line constraint.",
      "NO_REAL_FOLD",
    );
  return creases;
}

export const solvePointToPoint = (
  source: Point2,
  target: Point2,
): FoldSolution => ({
  operation: "point-to-point",
  description:
    "The crease is the perpendicular bisector of the source and target points.",
  creases: [foldPointToPoint(source, target)],
  assumptions: ["Source and target points are distinct."],
});

export const solveLineToLine = (
  source: OrientedLine,
  target: OrientedLine,
  branch: FoldBranch,
): FoldSolution => ({
  operation: "line-to-line",
  description: `${branch === "internal" ? "Internal" : "External"} angle-bisector branch maps the source line onto the target line.`,
  creases: [foldLineToLine(source, target, branch)],
  branch,
  assumptions: [
    "Coincident lines are excluded.",
    "Intersecting lines require an explicit branch.",
  ],
});

export const solveThroughPoint = (
  point: Point2,
  direction: Point2,
): FoldSolution => ({
  operation: "through-point",
  description:
    "The crease passes through the specified point with the supplied direction.",
  creases: [foldThroughPoint(point, direction)],
  assumptions: ["The supplied direction is nonzero."],
});

export const solvePointToLineThroughPoint = (
  source: Point2,
  targetLine: OrientedLine,
  through: Point2,
): FoldSolution => ({
  operation: "point-to-line-through-point",
  description:
    "Each target is an intersection of the target line with the circle centered at the through-point and passing through the source.",
  creases: foldPointToLineThroughPoint(source, targetLine, through),
  assumptions: ["Only real line-circle intersections produce folds."],
});
