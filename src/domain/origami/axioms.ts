import type { Point2 } from "../geometry/types";
import { OrigamiError, type FoldBranch, type OrientedLine } from "./types";
import { ORIGAMI_EPSILON, add, distance, dot, leftNormal, lineThrough, lineThroughPoints, normalize, reflectPoint, scale, signedDistanceToLine, subtract } from "./geometry";
import { foldLineToLine, foldPointToLineThroughPoint, foldPointToPoint } from "./folds";
import { realPolynomialRoots } from "./polynomialRoots";

export type AxiomId = "O1" | "O2" | "O3" | "O4" | "O5" | "O6" | "O7";
export type AxiomRequest =
  | { axiom: "O1"; first: Point2; second: Point2 }
  | { axiom: "O2"; source: Point2; target: Point2 }
  | { axiom: "O3"; source: OrientedLine; target: OrientedLine }
  | { axiom: "O4"; through: Point2; perpendicularTo: OrientedLine }
  | { axiom: "O5"; source: Point2; targetLine: OrientedLine; through: Point2 }
  | { axiom: "O6"; firstPoint: Point2; firstTarget: OrientedLine; secondPoint: Point2; secondTarget: OrientedLine }
  | { axiom: "O7"; source: Point2; targetLine: OrientedLine; perpendicularTo: OrientedLine };
export type AxiomCandidate = { crease: OrientedLine; residuals: Record<string, number>; maxResidual: number; rootParameter?: number; branch?: FoldBranch };
export type AxiomSolution = { axiom: AxiomId; description: string; assumptions: string[]; candidates: AxiomCandidate[]; degeneracies: string[] };
export const AXIOM_RESIDUAL_TOLERANCE = 1e-7;

const canonicalLine = (line: OrientedLine): OrientedLine => {
  let direction = normalize(line.direction);
  if (direction.x < -ORIGAMI_EPSILON || (Math.abs(direction.x) <= ORIGAMI_EPSILON && direction.y < 0)) direction = scale(direction, -1);
  return { direction, point: subtract(line.point, scale(direction, dot(line.point, direction))) };
};

const lineKey = (line: OrientedLine) => {
  const canonical = canonicalLine(line); const normal = leftNormal(canonical);
  return [Math.atan2(canonical.direction.y, canonical.direction.x), dot(canonical.point, normal)];
};

const candidate = (crease: OrientedLine, residuals: Record<string, number>, extra: Partial<AxiomCandidate> = {}): AxiomCandidate => {
  const maxResidual = Math.max(0, ...Object.values(residuals).map(Math.abs));
  if (!Number.isFinite(maxResidual) || maxResidual > AXIOM_RESIDUAL_TOLERANCE) throw new OrigamiError(`A computed crease failed certification with residual ${maxResidual}.`, "AXIOM_RESIDUAL_FAILURE");
  return { crease: canonicalLine(crease), residuals, maxResidual, ...extra };
};
const sorted = (candidates: AxiomCandidate[]) => candidates.sort((first, second) => { const a = lineKey(first.crease); const b = lineKey(second.crease); return a[0] - b[0] || a[1] - b[1]; }).filter((item, index, values) => index === 0 || Math.abs(lineKey(item.crease)[0] - lineKey(values[index - 1].crease)[0]) > 1e-8 || Math.abs(lineKey(item.crease)[1] - lineKey(values[index - 1].crease)[1]) > 1e-8);
const reflectedLineResidual = (source: OrientedLine, target: OrientedLine, crease: OrientedLine) => Math.max(Math.abs(signedDistanceToLine(reflectPoint(source.point, crease), target)), Math.abs(signedDistanceToLine(reflectPoint(add(source.point, source.direction), crease), target)));

export const solveO1 = (first: Point2, second: Point2): AxiomSolution => {
  if (distance(first, second) <= ORIGAMI_EPSILON) throw new OrigamiError("O1 requires two distinct points.", "O1_COINCIDENT_POINTS");
  const crease = lineThroughPoints(first, second);
  return { axiom: "O1", description: "Fold through two specified points.", assumptions: ["The two points are distinct."], candidates: [candidate(crease, { firstPoint: signedDistanceToLine(first, crease), secondPoint: signedDistanceToLine(second, crease) })], degeneracies: [] };
};

export const solveO2 = (source: Point2, target: Point2): AxiomSolution => {
  const crease = foldPointToPoint(source, target);
  return { axiom: "O2", description: "Fold one point onto another.", assumptions: ["Source and target are distinct."], candidates: [candidate(crease, { pointMatch: distance(reflectPoint(source, crease), target) })], degeneracies: [] };
};

export const solveO3 = (source: OrientedLine, target: OrientedLine): AxiomSolution => {
  const candidates: AxiomCandidate[] = [];
  for (const branch of ["internal", "external"] as const) {
    try { const crease = foldLineToLine(source, target, branch); candidates.push(candidate(crease, { lineMatch: reflectedLineResidual(source, target, crease) }, { branch })); } catch (error) { if (!(error instanceof OrigamiError)) throw error; }
  }
  if (!candidates.length) throw new OrigamiError("O3 has no uniquely determined crease for coincident lines.", "O3_COINCIDENT_LINES");
  return { axiom: "O3", description: "Fold one line onto another using every real angle-bisector branch.", assumptions: ["Coincident lines are excluded."], candidates: sorted(candidates), degeneracies: candidates.length === 1 ? ["Parallel lines have one finite bisector."] : [] };
};

export const solveO4 = (through: Point2, perpendicularTo: OrientedLine): AxiomSolution => {
  const crease = lineThrough(through, leftNormal(perpendicularTo));
  return { axiom: "O4", description: "Fold through a point perpendicular to a line.", assumptions: ["The supplied line has nonzero direction."], candidates: [candidate(crease, { throughPoint: signedDistanceToLine(through, crease), perpendicular: dot(crease.direction, perpendicularTo.direction) })], degeneracies: [] };
};

export const solveO5 = (source: Point2, targetLine: OrientedLine, through: Point2): AxiomSolution => {
  const creases = foldPointToLineThroughPoint(source, targetLine, through);
  return { axiom: "O5", description: "Fold a point onto a line through a specified point.", assumptions: ["Only real line-circle intersections produce folds."], candidates: sorted(creases.map((crease) => candidate(crease, { throughPoint: signedDistanceToLine(through, crease), pointOnLine: signedDistanceToLine(reflectPoint(source, crease), targetLine) }))), degeneracies: creases.length === 1 ? ["The constraint is tangent or has one nondegenerate real branch."] : [] };
};

type Polynomial = number[];
const polyAdd = (a: Polynomial, b: Polynomial) => Array.from({ length: Math.max(a.length, b.length) }, (_, index) => (a[index] ?? 0) + (b[index] ?? 0));
const polyScale = (a: Polynomial, amount: number) => a.map((value) => value * amount);
const polyMultiply = (a: Polynomial, b: Polynomial) => { const result = Array(a.length + b.length - 1).fill(0) as number[]; a.forEach((left, i) => b.forEach((right, j) => { result[i + j] += left * right; })); return result; };
const polyDot = (a: [Polynomial, Polynomial], b: [Polynomial, Polynomial]) => polyAdd(polyMultiply(a[0], b[0]), polyMultiply(a[1], b[1]));

export const solveO6 = (firstPoint: Point2, firstTarget: OrientedLine, secondPoint: Point2, secondTarget: OrientedLine): AxiomSolution => {
  const d = firstTarget.direction; const a = subtract(firstTarget.point, firstPoint); const b = subtract(secondPoint, scale(add(firstPoint, firstTarget.point), 0.5));
  const v: [Polynomial, Polynomial] = [[a.x, d.x], [a.y, d.y]];
  const p2MinusMid: [Polynomial, Polynomial] = [[b.x, -d.x / 2], [b.y, -d.y / 2]];
  const normal2 = leftNormal(secondTarget);
  const distanceBase = signedDistanceToLine(secondPoint, secondTarget);
  const denominator = polyDot(v, v);
  const normalDotV = polyAdd(polyScale(v[0], normal2.x), polyScale(v[1], normal2.y));
  const vDotOffset = polyDot(v, p2MinusMid);
  const coefficients = polyAdd(polyScale(denominator, distanceBase), polyScale(polyMultiply(normalDotV, vDotOffset), -2));
  const roots = realPolynomialRoots(coefficients);
  const candidates = roots.flatMap((root) => {
    const target = add(firstTarget.point, scale(d, root));
    if (distance(firstPoint, target) <= 1e-8) return [];
    const crease = foldPointToPoint(firstPoint, target);
    const residuals = { firstPointOnLine: signedDistanceToLine(reflectPoint(firstPoint, crease), firstTarget), secondPointOnLine: signedDistanceToLine(reflectPoint(secondPoint, crease), secondTarget) };
    return Math.max(...Object.values(residuals).map(Math.abs)) <= 1e-7 ? [candidate(crease, residuals, { rootParameter: root })] : [];
  });
  if (!candidates.length) throw new OrigamiError("O6 has no real nondegenerate crease satisfying both point-to-line constraints.", "O6_NO_REAL_FOLD");
  return { axiom: "O6", description: "Fold two points onto two lines simultaneously; the candidate parameter satisfies a cubic polynomial.", assumptions: ["Target lines have nonzero directions.", "Degenerate point-target coincidences are excluded."], candidates: sorted(candidates), degeneracies: roots.length !== candidates.length ? ["A degenerate cubic root did not define a crease."] : [] };
};

export const solveO7 = (source: Point2, targetLine: OrientedLine, perpendicularTo: OrientedLine): AxiomSolution => {
  const axis = normalize(perpendicularTo.direction); const targetNormal = leftNormal(targetLine); const divisor = 2 * dot(targetNormal, axis);
  if (Math.abs(divisor) <= ORIGAMI_EPSILON) throw new OrigamiError("O7 has no unique crease because the perpendicular constraint cannot move the point toward the target line.", "O7_PARALLEL_CONSTRAINT");
  const offset = dot(axis, source) + dot(targetNormal, subtract(targetLine.point, source)) / divisor;
  const crease = lineThrough(scale(axis, offset), leftNormal(perpendicularTo));
  return { axiom: "O7", description: "Fold a point onto a line with the crease perpendicular to another line.", assumptions: ["The target and perpendicular constraint determine a finite offset."], candidates: [candidate(crease, { pointOnLine: signedDistanceToLine(reflectPoint(source, crease), targetLine), perpendicular: dot(crease.direction, perpendicularTo.direction) })], degeneracies: [] };
};

export function solveAxiom(request: AxiomRequest): AxiomSolution {
  switch (request.axiom) {
    case "O1": return solveO1(request.first, request.second);
    case "O2": return solveO2(request.source, request.target);
    case "O3": return solveO3(request.source, request.target);
    case "O4": return solveO4(request.through, request.perpendicularTo);
    case "O5": return solveO5(request.source, request.targetLine, request.through);
    case "O6": return solveO6(request.firstPoint, request.firstTarget, request.secondPoint, request.secondTarget);
    case "O7": return solveO7(request.source, request.targetLine, request.perpendicularTo);
  }
}
