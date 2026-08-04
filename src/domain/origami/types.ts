import type { Point2 } from "../geometry/types";

export type Vector2 = Point2;

/** Oriented infinite line. Positive signed distance is the left side. */
export type OrientedLine = {
  point: Point2;
  direction: Vector2;
};

export type FoldBranch = "internal" | "external";
export type MovingSide = "left" | "right";

export type PaperFace = {
  id: string;
  points: Point2[];
  layer: number;
  side: "front" | "back";
};

export type PaperModel = {
  id: string;
  faces: PaperFace[];
  creases: { id: string; line: OrientedLine }[];
};

export type FlatFoldResult = {
  before: PaperModel;
  after: PaperModel;
  crease: OrientedLine;
  movingSide: MovingSide;
  movingFaces: { source: PaperFace; target: PaperFace }[];
  stationaryFaces: PaperFace[];
};

export type FoldSolution = {
  operation:
    | "point-to-point"
    | "line-to-line"
    | "through-point"
    | "point-to-line-through-point"
    | "formal-axiom";
  description: string;
  creases: OrientedLine[];
  branch?: FoldBranch;
  assumptions: string[];
};

export class OrigamiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
  }
}
