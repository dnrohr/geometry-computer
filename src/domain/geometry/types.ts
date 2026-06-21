export type Point2 = { x: number; y: number };

export type GeomObjectKind =
  | "point"
  | "segment"
  | "line"
  | "ray"
  | "circle"
  | "arc"
  | "label"
  | "triangle";
export type GeomRole =
  | "input"
  | "unit"
  | "active-construction"
  | "scaffold"
  | "intermediate"
  | "result"
  | "proof-highlight"
  | "ghost";

type GeometryData =
  | { kind: "point"; position: Point2 }
  | { kind: "segment" | "line" | "ray"; start: Point2; end: Point2 }
  | { kind: "circle"; center: Point2; radius: number }
  | {
      kind: "arc";
      center: Point2;
      radius: number;
      startAngle: number;
      endAngle: number;
    }
  | { kind: "label"; position: Point2; text: string }
  | { kind: "triangle"; points: [Point2, Point2, Point2] };

export type GeomObject = {
  id: string;
  kind: GeomObjectKind;
  role: GeomRole;
  label?: string;
  createdByStepId: string;
  usedByStepIds: string[];
  represents?: string;
  dependsOnObjectIds: string[];
  data: GeometryData;
};

export type GeometryMetadata = Omit<GeomObject, "kind" | "data">;

export function geometryObject(
  data: GeometryData,
  metadata: GeometryMetadata,
): GeomObject {
  return { ...metadata, kind: data.kind, data };
}

export const pointObject = (
  position: Point2,
  metadata: GeometryMetadata,
): GeomObject => geometryObject({ kind: "point", position }, metadata);
export const segmentObject = (
  start: Point2,
  end: Point2,
  metadata: GeometryMetadata,
): GeomObject => geometryObject({ kind: "segment", start, end }, metadata);
export const lineObject = (
  start: Point2,
  end: Point2,
  metadata: GeometryMetadata,
): GeomObject => geometryObject({ kind: "line", start, end }, metadata);
export const rayObject = (
  start: Point2,
  end: Point2,
  metadata: GeometryMetadata,
): GeomObject => geometryObject({ kind: "ray", start, end }, metadata);
export const circleObject = (
  center: Point2,
  radius: number,
  metadata: GeometryMetadata,
): GeomObject => geometryObject({ kind: "circle", center, radius }, metadata);
export const arcObject = (
  center: Point2,
  radius: number,
  startAngle: number,
  endAngle: number,
  metadata: GeometryMetadata,
): GeomObject =>
  geometryObject(
    { kind: "arc", center, radius, startAngle, endAngle },
    metadata,
  );
export const labelObject = (
  position: Point2,
  text: string,
  metadata: GeometryMetadata,
): GeomObject => geometryObject({ kind: "label", position, text }, metadata);
export const triangleObject = (
  points: [Point2, Point2, Point2],
  metadata: GeometryMetadata,
): GeomObject => geometryObject({ kind: "triangle", points }, metadata);
