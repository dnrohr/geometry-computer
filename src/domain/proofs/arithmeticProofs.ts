import type { ConstructionOpKind, OperationProof } from "../construction/types";

const proof = (
  operation: ConstructionOpKind,
  title: string,
  intuition: string,
  claim: string,
  conclusion: string,
  mathLatex?: string,
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
      text: claim,
      mathLatex,
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
    "Copying a segment preserves its length, and end-to-end directed displacements add.",
    "The endpoint displacement is x + y.",
  ),
  sub: proof(
    "sub",
    "Directed subtraction",
    "Transfer the second length in the opposite direction.",
    "Reversing the copied segment changes its sign, so the displacements combine as x − y.",
    "The directed displacement is x − y.",
  ),
  mul: proof(
    "mul",
    "Similar-triangle multiplication",
    "Scale y by x relative to the unit segment.",
    "The parallel lines make the reference and result triangles similar, so corresponding side ratios agree.",
    "Since r/y = x/1, the constructed length r = xy.",
    "r/y=x/1",
  ),
  div: proof(
    "div",
    "Similar-triangle division",
    "Reverse the scaling ratio.",
    "The parallel lines make the two triangles similar; solving their shared ratio reverses the multiplication scale.",
    "The constructed length is x/y.",
    "r/1=x/y",
    ["y ≠ 0"],
  ),
  square: proof(
    "square",
    "Geometric squaring",
    "Use the input on both sides of the multiplication template.",
    "The similar-triangle multiplication uses x as both factors.",
    "The result is x².",
    "r=x·x=x²",
  ),
  sqrt: proof(
    "sqrt",
    "Geometric mean",
    "An altitude to a semicircle is the geometric mean of the two diameter parts.",
    "The semicircle forms a right triangle. Its altitude theorem says the altitude squared equals the product of the two diameter parts.",
    "Since h² = 1·x and the upper altitude is nonnegative, h = √x.",
    "h²=1·x",
    ["x ≥ 0"],
  ),
};
