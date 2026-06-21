import type { Point2 } from "./types";

export type Viewport = { x: number; y: number; width: number; height: number };
export const DEFAULT_TOLERANCE = 1e-9;

export const distance = (a: Point2, b: Point2): number =>
  Math.hypot(b.x - a.x, b.y - a.y);
export const midpoint = (a: Point2, b: Point2): Point2 => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
});
export const nearlyEqual = (
  a: number,
  b: number,
  tolerance = DEFAULT_TOLERANCE,
): boolean => Math.abs(a - b) <= tolerance;

export function toViewport(
  point: Point2,
  bounds: Viewport,
  viewport: Viewport,
): Point2 {
  return {
    x: viewport.x + ((point.x - bounds.x) / bounds.width) * viewport.width,
    y: viewport.y + ((point.y - bounds.y) / bounds.height) * viewport.height,
  };
}
