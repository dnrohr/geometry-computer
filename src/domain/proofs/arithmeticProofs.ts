import type { ConstructionOpKind, OperationProof } from "../construction/types";

const proof = (
  operation: ConstructionOpKind,
  title: string,
  intuition: string,
  conclusion: string,
  assumptions: string[] = [],
): OperationProof => ({
  id: `proof-${operation}`,
  title,
  operation,
  intuition,
  givens: ["The input lengths and a fixed unit length are given."],
  claims: [
    {
      id: `claim-${operation}`,
      text:
        operation === "mul" || operation === "div"
          ? "Parallel lines make corresponding triangles similar, so their side ratios agree."
          : "Rigid compass transfers preserve length.",
      mathLatex: operation === "mul" ? "z/y=x/1" : undefined,
      highlightObjectIds: [],
    },
  ],
  conclusion,
  assumptions,
});
export const arithmeticProofs: Record<string, OperationProof> = {
  add: proof(
    "add",
    "Segment addition",
    "Place directed lengths consecutively.",
    "The endpoint displacement is x + y.",
  ),
  sub: proof(
    "sub",
    "Directed subtraction",
    "Transfer the second length in the opposite direction.",
    "The directed displacement is x − y.",
  ),
  mul: proof(
    "mul",
    "Similar-triangle multiplication",
    "Scale y by x relative to the unit segment.",
    "Since z/y = x/1, z = xy.",
  ),
  div: proof(
    "div",
    "Similar-triangle division",
    "Reverse the scaling ratio.",
    "The constructed length is x/y.",
    ["y ≠ 0"],
  ),
  square: proof(
    "square",
    "Geometric squaring",
    "Use the input on both sides of the multiplication template.",
    "The result is x².",
  ),
  sqrt: proof(
    "sqrt",
    "Geometric mean",
    "An altitude to a semicircle is the geometric mean of the two diameter parts.",
    "h² = 1·x, hence h = √x.",
    ["x ≥ 0"],
  ),
};
