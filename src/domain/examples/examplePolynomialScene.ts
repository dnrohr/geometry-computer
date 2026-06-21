import { compileExpression } from "../compiler/compileExpression";
import { parseExpression } from "../parser/parseExpression";

export type ConstructionScene = ReturnType<typeof compileExpression>;
export const examplePolynomialScene = compileExpression(
  parseExpression("(3*a + b) * (a + b)"),
  { a: 2, b: 1 },
  "3a² + 4ab + b²",
  "(3a + b)(a + b)",
);
