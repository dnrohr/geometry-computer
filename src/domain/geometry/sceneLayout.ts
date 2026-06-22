import type { GeomObject, Point2 } from "./types";

export type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

const include = (bounds: Bounds, point: Point2, padding = 0) => {
  bounds.minX = Math.min(bounds.minX, point.x - padding);
  bounds.minY = Math.min(bounds.minY, point.y - padding);
  bounds.maxX = Math.max(bounds.maxX, point.x + padding);
  bounds.maxY = Math.max(bounds.maxY, point.y + padding);
};

export function geometryBounds(objects: GeomObject[]): Bounds {
  const bounds: Bounds = {
    minX: Number.POSITIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
  };
  objects.forEach(({ data }) => {
    switch (data.kind) {
      case "point":
        include(bounds, data.position, 7);
        break;
      case "segment":
      case "line":
      case "ray":
        include(bounds, data.start);
        include(bounds, data.end);
        break;
      case "circle":
      case "arc":
        include(bounds, data.center, data.radius);
        break;
      case "label":
        include(bounds, data.position, Math.max(10, data.text.length * 4));
        break;
      case "triangle":
        data.points.forEach((point) => include(bounds, point));
        break;
    }
  });
  return bounds;
}
