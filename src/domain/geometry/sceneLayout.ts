import type { GeomObject, Point2 } from "./types";

export type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export type LabelBounds = Bounds;

const labelSize = (text: string) => ({
  width: Math.max(18, Array.from(text).length * 8.4),
  height: 19,
});

export function labelBounds(
  text: string,
  position: Point2,
  clearance = 4,
): LabelBounds {
  const { width, height } = labelSize(text);
  return {
    minX: position.x - width / 2 - clearance,
    minY: position.y - height + clearance / 2,
    maxX: position.x + width / 2 + clearance,
    maxY: position.y + clearance,
  };
}

export const boundsOverlap = (left: Bounds, right: Bounds) =>
  left.minX < right.maxX &&
  left.maxX > right.minX &&
  left.minY < right.maxY &&
  left.maxY > right.minY;

const labelOffsets = (() => {
  const candidates: Point2[] = [];
  for (let y = -176; y <= 176; y += 22)
    for (let x = -120; x <= 120; x += 30) candidates.push({ x, y });
  return candidates.sort((left, right) => {
    const leftCost = left.x ** 2 * 1.35 + left.y ** 2;
    const rightCost = right.x ** 2 * 1.35 + right.y ** 2;
    return leftCost - rightCost;
  });
})();

export function layoutLabels(objects: GeomObject[]): GeomObject[] {
  const occupied: LabelBounds[] = [];
  return objects.map((object) => {
    if (object.data.kind !== "label") return object;
    const label = object.data;
    const original = label.position;
    const offset =
      labelOffsets.find((candidate) => {
        const candidateBounds = labelBounds(label.text, {
          x: original.x + candidate.x,
          y: original.y + candidate.y,
        });
        return occupied.every(
          (placed) => !boundsOverlap(candidateBounds, placed),
        );
      }) ?? labelOffsets[0];
    const position = {
      x: original.x + offset.x,
      y: original.y + offset.y,
    };
    occupied.push(labelBounds(label.text, position));
    return {
      ...object,
      data: { ...object.data, position },
    };
  });
}

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
        {
          const textBounds = labelBounds(data.text, data.position, 0);
          include(bounds, { x: textBounds.minX, y: textBounds.minY });
          include(bounds, { x: textBounds.maxX, y: textBounds.maxY });
        }
        break;
      case "triangle":
        data.points.forEach((point) => include(bounds, point));
        break;
    }
  });
  return bounds;
}
