import type { Point2 } from "../geometry/types";
import { OrigamiError, type OrientedLine, type Vector2 } from "./types";

export const ORIGAMI_EPSILON = 1e-9;

export const add = (a: Point2, b: Vector2): Point2 => ({
  x: a.x + b.x,
  y: a.y + b.y,
});
export const subtract = (a: Point2, b: Point2): Vector2 => ({
  x: a.x - b.x,
  y: a.y - b.y,
});
export const scale = (vector: Vector2, amount: number): Vector2 => ({
  x: vector.x * amount,
  y: vector.y * amount,
});
export const dot = (a: Vector2, b: Vector2) => a.x * b.x + a.y * b.y;
export const cross = (a: Vector2, b: Vector2) => a.x * b.y - a.y * b.x;
export const magnitude = (vector: Vector2) => Math.hypot(vector.x, vector.y);
export const distance = (a: Point2, b: Point2) => magnitude(subtract(a, b));

export function normalize(vector: Vector2): Vector2 {
  const length = magnitude(vector);
  if (length <= ORIGAMI_EPSILON)
    throw new OrigamiError(
      "A line direction cannot be zero.",
      "ZERO_DIRECTION",
    );
  return scale(vector, 1 / length);
}

export function lineThrough(point: Point2, direction: Vector2): OrientedLine {
  return { point: { ...point }, direction: normalize(direction) };
}

export function lineThroughPoints(a: Point2, b: Point2): OrientedLine {
  return lineThrough(a, subtract(b, a));
}

export const leftNormal = (line: OrientedLine): Vector2 => ({
  x: -line.direction.y,
  y: line.direction.x,
});

export const signedDistanceToLine = (point: Point2, line: OrientedLine) =>
  dot(subtract(point, line.point), leftNormal(line));

export const projectPointToLine = (point: Point2, line: OrientedLine): Point2 =>
  add(
    line.point,
    scale(line.direction, dot(subtract(point, line.point), line.direction)),
  );

export const reflectPoint = (point: Point2, crease: OrientedLine): Point2 => {
  const normal = leftNormal(crease);
  return subtract(
    point,
    scale(normal, 2 * signedDistanceToLine(point, crease)),
  );
};

export const reflectPolygon = (points: Point2[], crease: OrientedLine) =>
  points.map((point) => reflectPoint(point, crease)).reverse();

export const polygonSignedArea = (points: Point2[]) =>
  points.reduce((area, point, index) => {
    const next = points[(index + 1) % points.length];
    return area + point.x * next.y - next.x * point.y;
  }, 0) / 2;

export function ensureCounterclockwise(points: Point2[]) {
  return polygonSignedArea(points) < 0 ? [...points].reverse() : [...points];
}

const interpolate = (a: Point2, b: Point2, amount: number): Point2 => ({
  x: a.x + (b.x - a.x) * amount,
  y: a.y + (b.y - a.y) * amount,
});

/** Clip a polygon to one oriented half-plane using Sutherland-Hodgman. */
export function clipPolygonToSide(
  points: Point2[],
  line: OrientedLine,
  side: "left" | "right",
): Point2[] {
  const sign = side === "left" ? 1 : -1;
  const result: Point2[] = [];
  points.forEach((current, index) => {
    const previous = points[(index + points.length - 1) % points.length];
    const currentDistance = sign * signedDistanceToLine(current, line);
    const previousDistance = sign * signedDistanceToLine(previous, line);
    const currentInside = currentDistance >= -ORIGAMI_EPSILON;
    const previousInside = previousDistance >= -ORIGAMI_EPSILON;
    if (currentInside !== previousInside) {
      const amount = previousDistance / (previousDistance - currentDistance);
      result.push(interpolate(previous, current, amount));
    }
    if (currentInside) result.push(current);
  });
  return deduplicatePolygon(result);
}

export function deduplicatePolygon(points: Point2[]): Point2[] {
  return points
    .filter(
      (point, index) =>
        index === 0 || distance(point, points[index - 1]) > ORIGAMI_EPSILON,
    )
    .filter(
      (point, index, filtered) =>
        filtered.length < 2 ||
        index !== filtered.length - 1 ||
        distance(point, filtered[0]) > ORIGAMI_EPSILON,
    );
}

export function linePolygonSegment(
  line: OrientedLine,
  polygon: Point2[],
): [Point2, Point2] {
  const intersections: Point2[] = [];
  polygon.forEach((start, index) => {
    const end = polygon[(index + 1) % polygon.length];
    const edge = subtract(end, start);
    const denominator = cross(line.direction, edge);
    if (Math.abs(denominator) <= ORIGAMI_EPSILON) return;
    const amount = cross(subtract(start, line.point), edge) / denominator;
    const edgeAmount =
      cross(subtract(start, line.point), line.direction) / denominator;
    if (edgeAmount >= -ORIGAMI_EPSILON && edgeAmount <= 1 + ORIGAMI_EPSILON)
      intersections.push(add(line.point, scale(line.direction, amount)));
  });
  const unique = intersections.filter(
    (point, index) =>
      intersections.findIndex(
        (candidate) => distance(point, candidate) <= ORIGAMI_EPSILON,
      ) === index,
  );
  if (unique.length < 2)
    throw new OrigamiError(
      "The crease does not cross the paper in two places.",
      "CREASE_OUTSIDE_PAPER",
    );
  unique.sort(
    (a, b) =>
      dot(subtract(a, line.point), line.direction) -
      dot(subtract(b, line.point), line.direction),
  );
  return [unique[0], unique[unique.length - 1]];
}
