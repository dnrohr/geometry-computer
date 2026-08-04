import { compileFlatFoldDocument } from "./compileFold";
import {
  solveLineToLine,
  solvePointToLineThroughPoint,
  solvePointToPoint,
  solveThroughPoint,
} from "./folds";
import { lineThrough } from "./geometry";
import { applyFlatFold, rectangularPaper } from "./paper";
import type { Point2 } from "../geometry/types";
import type { FoldBranch, MovingSide } from "./types";
import type { OrigamiExample } from "./examples";
import type { PaperModel } from "./types";
import { solveAxiom, type AxiomRequest } from "./axioms";

type Base = { title: string; movingSide: MovingSide };
export type GuidedFoldRequest =
  | (Base & { operation: "point-to-point"; source: Point2; target: Point2 })
  | (Base & {
      operation: "line-to-line";
      sourceAngle: number;
      targetAngle: number;
      branch: FoldBranch;
    })
  | (Base & { operation: "parallel"; sourceY: number; targetY: number })
  | (Base & { operation: "through-point"; through: Point2; angle: number })
  | (Base & {
      operation: "point-to-line-through-point";
      source: Point2;
      targetX: number;
      through: Point2;
      candidate: number;
    })
  | (Base & {
      operation: "formal-axiom";
      request: AxiomRequest;
      candidate: number;
    });

const direction = (degrees: number) => {
  const radians = (degrees * Math.PI) / 180;
  return { x: Math.cos(radians), y: Math.sin(radians) };
};

export function compileGuidedFold(
  request: GuidedFoldRequest,
  paper: PaperModel = rectangularPaper(10, 6),
): {
  example: OrigamiExample;
  document: ReturnType<typeof compileFlatFoldDocument>;
  paperAfter: PaperModel;
} {
  let solution;
  let source: Point2 | undefined;
  let target: Point2 | undefined;
  let targetLine;
  let branch: FoldBranch | undefined;
  if (request.operation === "formal-axiom") {
    const formal = solveAxiom(request.request);
    solution = {
      operation: "formal-axiom" as const,
      description: formal.description,
      creases: formal.candidates.map(({ crease }) => crease),
      assumptions: formal.assumptions,
    };
  } else if (request.operation === "point-to-point") {
    source = request.source;
    target = request.target;
    solution = solvePointToPoint(source, target);
  } else if (request.operation === "line-to-line") {
    branch = request.branch;
    solution = solveLineToLine(
      lineThrough({ x: 5, y: 3 }, direction(request.sourceAngle)),
      lineThrough({ x: 5, y: 3 }, direction(request.targetAngle)),
      branch,
    );
  } else if (request.operation === "parallel") {
    solution = solveLineToLine(
      lineThrough({ x: 0, y: request.sourceY }, { x: 1, y: 0 }),
      lineThrough({ x: 0, y: request.targetY }, { x: 1, y: 0 }),
      "internal",
    );
  } else if (request.operation === "through-point") {
    solution = solveThroughPoint(request.through, direction(request.angle));
  } else {
    source = request.source;
    targetLine = lineThrough({ x: request.targetX, y: 0 }, { x: 0, y: 1 });
    solution = solvePointToLineThroughPoint(
      source,
      targetLine,
      request.through,
    );
  }
  const candidate =
    request.operation === "point-to-line-through-point" ||
    request.operation === "formal-axiom"
      ? request.candidate
      : 0;
  const crease = solution.creases[candidate];
  if (!crease)
    throw new Error(
      `Crease candidate ${candidate + 1} is not available. Choose one of the ${solution.creases.length} real candidates.`,
    );
  const result = applyFlatFold(paper, crease, request.movingSide);
  const document = compileFlatFoldDocument(
    result,
    request.title || "Guided fold",
    { sourcePoint: source, targetPoint: target, targetLine },
  );
  const example: OrigamiExample = {
    id: "guided-fold",
    title: request.title || "Guided fold",
    description: solution.description,
    crease,
    movingSide: request.movingSide,
    source,
    target,
    operation: solution.operation,
    solutionDescription: solution.description,
    branch: branch ?? solution.branch,
    assumptions: solution.assumptions,
  };
  return { example, document, paperAfter: result.after };
}
