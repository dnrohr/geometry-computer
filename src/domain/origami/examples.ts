import { compileFlatFoldDocument } from "./compileFold";
import { solveLineToLine, solvePointToPoint } from "./folds";
import { lineThrough } from "./geometry";
import { applyFlatFold, rectangularPaper } from "./paper";
import type {
  FoldBranch,
  FoldSolution,
  MovingSide,
  OrientedLine,
} from "./types";

export type OrigamiExample = {
  id: string;
  title: string;
  description: string;
  crease: OrientedLine;
  movingSide: MovingSide;
  source?: { x: number; y: number };
  target?: { x: number; y: number };
  unfold?: boolean;
  operation: FoldSolution["operation"];
  solutionDescription: string;
  branch?: FoldBranch;
  assumptions: string[];
};

const pointFold = (
  id: string,
  title: string,
  description: string,
  source: { x: number; y: number },
  target: { x: number; y: number },
  movingSide: MovingSide,
  unfold = false,
): OrigamiExample => {
  const solution = solvePointToPoint(source, target);
  return {
    id,
    title,
    description,
    source,
    target,
    movingSide,
    unfold,
    crease: solution.creases[0],
    operation: solution.operation,
    solutionDescription: solution.description,
    branch: solution.branch,
    assumptions: solution.assumptions,
  };
};

const horizontal = lineThrough({ x: 0, y: 0 }, { x: 1, y: 0 });
const vertical = lineThrough({ x: 0, y: 0 }, { x: 0, y: 1 });

export const origamiExamples: OrigamiExample[] = [
  pointFold(
    "edge-bisection",
    "Edge bisection",
    "Fold the left edge onto the right edge.",
    { x: 0, y: 3 },
    { x: 10, y: 3 },
    "left",
  ),
  pointFold(
    "corner-to-corner",
    "Corner to corner",
    "Fold one corner onto its opposite corner.",
    { x: 0, y: 0 },
    { x: 10, y: 6 },
    "left",
  ),
  (() => {
    const solution = solveLineToLine(horizontal, vertical, "internal");
    return {
      id: "angle-bisector",
      title: "Angle bisector",
      description: "Match two perpendicular edges to bisect their angle.",
      source: { x: 5, y: 0 },
      target: { x: 0, y: 5 },
      movingSide: "right",
      crease: solution.creases[0],
      operation: solution.operation,
      solutionDescription: solution.description,
      branch: solution.branch,
      assumptions: solution.assumptions,
    };
  })(),
  pointFold(
    "perpendicular-bisector",
    "Perpendicular bisector",
    "Fold two points together, then unfold to retain the crease.",
    { x: 2, y: 3 },
    { x: 8, y: 3 },
    "left",
    true,
  ),
];

export function compileOrigamiExample(example: OrigamiExample) {
  const result = applyFlatFold(
    rectangularPaper(10, 6),
    example.crease,
    example.movingSide,
  );
  return compileFlatFoldDocument(result, example.title, {
    sourcePoint: example.source,
    targetPoint: example.target,
    unfold: example.unfold,
  });
}
