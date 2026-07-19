import type {
  OrigamiAxiomKind,
  OrigamiDegeneracy,
  OrigamiLine,
  OrigamiPoint,
} from "../types";

const EPSILON = 1e-9;

export type OrigamiAxiomSolution = {
  id: string;
  axiom: OrigamiAxiomKind;
  crease: OrigamiLine;
  reflectedPoints?: OrigamiPoint[];
  degeneracies?: OrigamiDegeneracy[];
};

export class OrigamiAxiomError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly degeneracies: OrigamiDegeneracy[] = [],
  ) {
    super(message);
  }
}

const nearlyZero = (value: number) => Math.abs(value) < EPSILON;

const add = (a: OrigamiPoint, b: OrigamiPoint): OrigamiPoint => ({
  x: a.x + b.x,
  y: a.y + b.y,
});

const sub = (a: OrigamiPoint, b: OrigamiPoint): OrigamiPoint => ({
  x: a.x - b.x,
  y: a.y - b.y,
});

const scale = (point: OrigamiPoint, scalar: number): OrigamiPoint => ({
  x: point.x * scalar,
  y: point.y * scalar,
});

const dot = (a: OrigamiPoint, b: OrigamiPoint) => a.x * b.x + a.y * b.y;
const cross = (a: OrigamiPoint, b: OrigamiPoint) => a.x * b.y - a.y * b.x;
const length = (point: OrigamiPoint) => Math.hypot(point.x, point.y);

const normalize = (point: OrigamiPoint, owner: string): OrigamiPoint => {
  const magnitude = length(point);
  if (nearlyZero(magnitude))
    throw new OrigamiAxiomError(
      `${owner} has a zero direction vector.`,
      "ZERO_DIRECTION",
    );
  return { x: point.x / magnitude, y: point.y / magnitude };
};

const canonicalLine = (line: OrigamiLine, owner: string): OrigamiLine => {
  const direction = normalize(line.direction, owner);
  return { point: line.point, direction };
};

const perpendicular = (point: OrigamiPoint): OrigamiPoint => ({
  x: -point.y,
  y: point.x,
});

const signedDistanceToLine = (point: OrigamiPoint, line: OrigamiLine) => {
  const normalized = canonicalLine(line, "Line");
  return cross(sub(point, normalized.point), normalized.direction);
};

const projectPointToLine = (
  point: OrigamiPoint,
  line: OrigamiLine,
): OrigamiPoint => {
  const normalized = canonicalLine(line, "Line");
  const offset = sub(point, normalized.point);
  return add(
    normalized.point,
    scale(normalized.direction, dot(offset, normalized.direction)),
  );
};

const intersectLines = (
  first: OrigamiLine,
  second: OrigamiLine,
): OrigamiPoint | undefined => {
  const a = canonicalLine(first, "First line");
  const b = canonicalLine(second, "Second line");
  const denominator = cross(a.direction, b.direction);
  if (nearlyZero(denominator)) return undefined;
  const distance = cross(sub(b.point, a.point), b.direction) / denominator;
  return add(a.point, scale(a.direction, distance));
};

export const reflectPointAcrossLine = (
  point: OrigamiPoint,
  line: OrigamiLine,
): OrigamiPoint => {
  const normalized = canonicalLine(line, "Crease");
  const projection = projectPointToLine(point, normalized);
  return add(projection, sub(projection, point));
};

export function foldPointToPoint(
  source: OrigamiPoint,
  target: OrigamiPoint,
): OrigamiAxiomSolution[] {
  const delta = sub(target, source);
  if (nearlyZero(length(delta))) {
    const degeneracy = {
      kind: "coincident-points" as const,
      message: "Coincident points cannot define a unique point-to-point fold.",
      objectIds: [],
    };
    throw new OrigamiAxiomError(degeneracy.message, "COINCIDENT_POINTS", [
      degeneracy,
    ]);
  }
  const midpoint = scale(add(source, target), 0.5);
  const crease = {
    point: midpoint,
    direction: normalize(perpendicular(delta), "Point-to-point crease"),
  };
  return [
    {
      id: "point-to-point-1",
      axiom: "point-to-point",
      crease,
      reflectedPoints: [target],
    },
  ];
}

export function foldPointToLine(
  point: OrigamiPoint,
  targetLine: OrigamiLine,
): OrigamiAxiomSolution[] {
  const target = canonicalLine(targetLine, "Target line");
  const distance = signedDistanceToLine(point, target);
  if (nearlyZero(distance)) {
    const degeneracy = {
      kind: "ambiguous-solutions" as const,
      message: "A point already on the target line has infinitely many folds.",
      objectIds: [],
    };
    throw new OrigamiAxiomError(degeneracy.message, "AMBIGUOUS_SOLUTIONS", [
      degeneracy,
    ]);
  }
  const image = projectPointToLine(point, target);
  const midpoint = scale(add(point, image), 0.5);
  return [
    {
      id: "point-to-line-1",
      axiom: "point-to-line",
      crease: {
        point: midpoint,
        direction: target.direction,
      },
      reflectedPoints: [image],
    },
  ];
}

export function foldLineToLine(
  sourceLine: OrigamiLine,
  targetLine: OrigamiLine,
): OrigamiAxiomSolution[] {
  const source = canonicalLine(sourceLine, "Source line");
  const target = canonicalLine(targetLine, "Target line");
  const determinant = cross(source.direction, target.direction);

  if (nearlyZero(determinant)) {
    const distance = signedDistanceToLine(target.point, source);
    if (nearlyZero(distance)) {
      const degeneracy = {
        kind: "ambiguous-solutions" as const,
        message: "Coincident lines have infinitely many alignment folds.",
        objectIds: [],
      };
      throw new OrigamiAxiomError(degeneracy.message, "AMBIGUOUS_SOLUTIONS", [
        degeneracy,
      ]);
    }
    const midpoint = add(
      source.point,
      scale(perpendicular(source.direction), -distance / 2),
    );
    return [
      {
        id: "line-to-line-parallel-1",
        axiom: "line-to-line",
        crease: {
          point: midpoint,
          direction: source.direction,
        },
        degeneracies: [
          {
            kind: "parallel-lines",
            message:
              "Parallel lines align by folding along their midline rather than an angle bisector.",
            objectIds: [],
          },
        ],
      },
    ];
  }

  const intersection = intersectLines(source, target)!;
  const sameOrientation = normalize(
    add(source.direction, target.direction),
    "Internal angle bisector",
  );
  const oppositeOrientation = normalize(
    sub(source.direction, target.direction),
    "External angle bisector",
  );
  const solutions = [
    {
      id: "line-to-line-1",
      axiom: "line-to-line" as const,
      crease: {
        point: intersection,
        direction: sameOrientation,
      },
    },
    {
      id: "line-to-line-2",
      axiom: "line-to-line" as const,
      crease: {
        point: intersection,
        direction: oppositeOrientation,
      },
    },
  ];
  return solutions.sort(
    (a, b) =>
      Math.atan2(a.crease.direction.y, a.crease.direction.x) -
      Math.atan2(b.crease.direction.y, b.crease.direction.x),
  );
}
