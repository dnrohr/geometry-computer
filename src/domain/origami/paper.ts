import {
  clipPolygonToSide,
  ensureCounterclockwise,
  polygonSignedArea,
  reflectPolygon,
} from "./geometry";
import {
  OrigamiError,
  type FlatFoldResult,
  type MovingSide,
  type OrientedLine,
  type PaperFace,
  type PaperModel,
} from "./types";

export function rectangularPaper(width: number, height: number): PaperModel {
  if (!(width > 0 && height > 0))
    throw new OrigamiError(
      "Paper dimensions must be positive.",
      "INVALID_PAPER",
    );
  return {
    id: "paper-1",
    faces: [
      {
        id: "face-1",
        points: [
          { x: 0, y: 0 },
          { x: width, y: 0 },
          { x: width, y: height },
          { x: 0, y: height },
        ],
        layer: 0,
        side: "front",
      },
    ],
    creases: [],
  };
}

const validFace = (face: PaperFace) =>
  face.points.length >= 3 && Math.abs(polygonSignedArea(face.points)) > 1e-8;

export function applyFlatFold(
  paper: PaperModel,
  crease: OrientedLine,
  movingSide: MovingSide,
): FlatFoldResult {
  const stationarySide = movingSide === "left" ? "right" : "left";
  const movingFaces: FlatFoldResult["movingFaces"] = [];
  const stationaryFaces: PaperFace[] = [];
  paper.faces.forEach((face) => {
    const stationaryPoints = clipPolygonToSide(
      face.points,
      crease,
      stationarySide,
    );
    const movingPoints = clipPolygonToSide(face.points, crease, movingSide);
    if (stationaryPoints.length >= 3) {
      const stationary = {
        ...face,
        id: `${face.id}-stationary`,
        points: ensureCounterclockwise(stationaryPoints),
      };
      if (validFace(stationary)) stationaryFaces.push(stationary);
    }
    if (movingPoints.length >= 3) {
      const source = {
        ...face,
        id: `${face.id}-moving`,
        points: ensureCounterclockwise(movingPoints),
      };
      const target = {
        ...source,
        id: `${source.id}-folded`,
        points: ensureCounterclockwise(reflectPolygon(source.points, crease)),
        layer: Math.max(...paper.faces.map(({ layer }) => layer), 0) + 1,
        side: source.side === "front" ? ("back" as const) : ("front" as const),
      };
      if (validFace(source) && validFace(target))
        movingFaces.push({ source, target });
    }
  });
  if (!movingFaces.length)
    throw new OrigamiError(
      "The selected side contains no paper to fold.",
      "EMPTY_MOVING_SIDE",
    );
  const creaseId = `crease-${paper.creases.length + 1}`;
  return {
    before: paper,
    crease,
    movingSide,
    movingFaces,
    stationaryFaces,
    after: {
      ...paper,
      faces: [...stationaryFaces, ...movingFaces.map(({ target }) => target)],
      creases: [...paper.creases, { id: creaseId, line: crease }],
    },
  };
}
