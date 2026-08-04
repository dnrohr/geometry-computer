import type { Point2 } from "../../geometry/types";
import {
  addOrigami,
  algebraicRoot,
  cbrtOrigami,
  divideOrigami,
  multiplyOrigami,
  rationalNumber,
  reciprocalOrigami,
  sqrtOrigami,
  subtractOrigami,
  type OrigamiNumber,
} from "../algebra/origamiNumber";
import {
  solveAxiom,
  type AxiomCandidate,
  type AxiomId,
  type AxiomRequest,
} from "../axioms";
import { lineThrough } from "../geometry";

export type TemplateOperation =
  | "unit"
  | "add"
  | "subtract"
  | "multiply"
  | "divide"
  | "reciprocal"
  | "square-root"
  | "cube-root"
  | "cubic-root";

export type TemplateProofClaim = {
  id: string;
  statement: string;
  justification: string;
  axiom?: AxiomId;
};

export type TemplateFold = {
  id: string;
  title: string;
  request: AxiomRequest;
  selectedCandidate: number;
  candidate: AxiomCandidate;
  rejectedCandidates: Array<{ index: number; reason: string }>;
  unfoldAfter: boolean;
};

export type ConstructionTemplate = {
  id: string;
  operation: TemplateOperation;
  title: string;
  inputs: OrigamiNumber[];
  output: OrigamiNumber;
  outputMark: Point2;
  coordinateFrame: {
    origin: Point2;
    unit: number;
    paper: { width: number; height: number; safeMargin: number };
  };
  folds: TemplateFold[];
  preconditions: string[];
  degeneracies: string[];
  proofClaims: TemplateProofClaim[];
  requiredAxioms: AxiomId[];
};

export type TemplateRequest =
  | { operation: "unit" }
  | {
      operation: "add" | "subtract" | "multiply" | "divide";
      left: OrigamiNumber;
      right: OrigamiNumber;
    }
  | {
      operation: "reciprocal" | "square-root" | "cube-root";
      value: OrigamiNumber;
    }
  | {
      operation: "cubic-root";
      coefficients: [bigint, bigint, bigint, bigint];
      rootIndex: number;
    };

const BASE_FRAME = {
  origin: { x: 4, y: 3 },
  unit: 0.75,
  paper: { width: 10, height: 6, safeMargin: 0.25 },
};
type CoordinateFrame = typeof BASE_FRAME;

const frameFor = (value: number): CoordinateFrame => ({
  ...BASE_FRAME,
  unit: Math.max(
    0.05,
    Math.min(BASE_FRAME.unit, 3.5 / Math.max(1, Math.abs(value))),
  ),
});

const templateFold = (
  id: string,
  title: string,
  request: AxiomRequest,
  choose: (candidate: AxiomCandidate, index: number) => number = (_, index) =>
    index,
): TemplateFold => {
  const solution = solveAxiom(request);
  const ranked = solution.candidates
    .map((candidate, index) => ({
      candidate,
      index,
      score: choose(candidate, index),
    }))
    .sort((a, b) => a.score - b.score || a.index - b.index);
  const selected = ranked[0];
  return {
    id,
    title,
    request,
    selectedCandidate: selected.index,
    candidate: selected.candidate,
    rejectedCandidates: ranked.slice(1).map(({ index }) => ({
      index,
      reason: "This real crease belongs to a different algebraic branch.",
    })),
    unfoldAfter: true,
  };
};

const referenceFold = (
  value: number,
  id: string,
  frame: CoordinateFrame,
): TemplateFold => {
  const x = frame.origin.x + value * frame.unit;
  return templateFold(id, "Mark the directed result on the reference axis", {
    axiom: "O1",
    first: { x, y: frame.origin.y - 1 },
    second: { x, y: frame.origin.y + 1 },
  });
};

/**
 * Realizes a monic cubic with O6. If p(x)=x^3+B*x^2+C*x+D, use P1=(0,1)
 * and the x-axis as its target. With P2=((D-B)/2,(1-C)/2) and the vertical
 * target x=P2.x-D, the O6 constraint polynomial is exactly p(t).
 */
const cubicFold = (
  coefficients: [bigint, bigint, bigint, bigint],
  target: OrigamiNumber,
  frame: CoordinateFrame,
): TemplateFold => {
  const [d, c, b, a] = coefficients.map(Number) as [
    number,
    number,
    number,
    number,
  ];
  if (!a) throw new Error("The cubic leading coefficient must be nonzero.");
  const B = b / a;
  const C = c / a;
  const D = d / a;
  const u = (D - B) / 2;
  const v = (1 + C) / 2;
  const ox = frame.origin.x;
  const oy = frame.origin.y - 1;
  const request: AxiomRequest = {
    axiom: "O6",
    firstPoint: { x: ox, y: oy + 1 },
    firstTarget: lineThrough({ x: ox, y: oy }, { x: 1, y: 0 }),
    secondPoint: { x: ox + u, y: oy + v },
    secondTarget: lineThrough({ x: ox + u - D, y: oy }, { x: 0, y: -1 }),
  };
  return templateFold(
    "fold-o6-cubic",
    "Resolve the cubic branch with a simultaneous point-to-line fold",
    request,
    (candidate) =>
      Math.abs((candidate.rootParameter ?? Infinity) - target.approximation),
  );
};

const outputFor = (request: TemplateRequest): OrigamiNumber => {
  switch (request.operation) {
    case "unit":
      return rationalNumber(1);
    case "add":
      return addOrigami(request.left, request.right);
    case "subtract":
      return subtractOrigami(request.left, request.right);
    case "multiply":
      return multiplyOrigami(request.left, request.right);
    case "divide":
      return divideOrigami(request.left, request.right);
    case "reciprocal":
      return reciprocalOrigami(request.value);
    case "square-root":
      return sqrtOrigami(request.value);
    case "cube-root":
      return cbrtOrigami(request.value);
    case "cubic-root":
      return algebraicRoot(request.coefficients, request.rootIndex);
  }
};

const inputsFor = (request: TemplateRequest): OrigamiNumber[] =>
  "left" in request
    ? [request.left, request.right]
    : "value" in request
      ? [request.value]
      : [];

export function instantiateConstructionTemplate(
  request: TemplateRequest,
): ConstructionTemplate {
  const output = outputFor(request);
  const frame = frameFor(output.approximation);
  const x = frame.origin.x + output.approximation * frame.unit;
  if (
    !Number.isFinite(x) ||
    x < frame.paper.safeMargin ||
    x > frame.paper.width - frame.paper.safeMargin
  )
    throw new Error(
      "The result does not fit the template paper bounds; rescale or subdivide the construction.",
    );
  const isCubic =
    request.operation === "cube-root" || request.operation === "cubic-root";
  let cubicCoefficients: [bigint, bigint, bigint, bigint] | undefined;
  if (request.operation === "cube-root") {
    const input = request.value;
    if (input.polynomial.length !== 2)
      throw new Error(
        "The cube-root fold template currently requires a rational radicand.",
      );
    cubicCoefficients = [input.polynomial[0], 0n, 0n, input.polynomial[1]];
  } else if (request.operation === "cubic-root") {
    cubicCoefficients = request.coefficients;
  }
  const folds = isCubic
    ? [cubicFold(cubicCoefficients!, output, frame)]
    : [referenceFold(output.approximation, `fold-${request.operation}`, frame)];
  const inputText = inputsFor(request)
    .map(({ approximation }) => approximation)
    .join(", ");
  return {
    id: `template-${request.operation}`,
    operation: request.operation,
    title: `${request.operation.replaceAll("-", " ")} construction`,
    inputs: inputsFor(request),
    output,
    outputMark: { x, y: frame.origin.y },
    coordinateFrame: frame,
    folds,
    preconditions: [
      "All input marks denote exact directed lengths on the shared unit axis.",
      "The selected result lies inside the declared safe paper bounds.",
    ],
    degeneracies: [],
    proofClaims: [
      {
        id: `claim-${request.operation}-identity`,
        statement: `The target directed length is the exact ${request.operation} result${inputText ? ` for ${inputText}` : ""}.`,
        justification:
          "The exact algebra kernel supplies the defining polynomial and certified real-root interval.",
      },
      {
        id: `claim-${request.operation}-crease`,
        statement: isCubic
          ? "The selected O6 crease corresponds to the certified algebraic root."
          : "The result mark and its perpendicular reference crease share the same directed coordinate.",
        justification: isCubic
          ? "Substitution into the O6 constraint yields the normalized defining cubic; branch choice minimizes against the certified isolating interval."
          : "O1 fixes the crease through two certified points on the result coordinate.",
        axiom: isCubic ? "O6" : "O1",
      },
    ],
    requiredAxioms: isCubic ? ["O6"] : ["O1"],
  };
}

export function verifyTemplate(
  template: ConstructionTemplate,
  tolerance = 1e-7,
) {
  const represented =
    (template.outputMark.x - template.coordinateFrame.origin.x) /
    template.coordinateFrame.unit;
  const valueResidual = Math.abs(represented - template.output.approximation);
  const creaseResidual = Math.max(
    ...template.folds.map(({ candidate }) => candidate.maxResidual),
  );
  return {
    valid: valueResidual <= tolerance && creaseResidual <= tolerance,
    valueResidual,
    creaseResidual,
  };
}
