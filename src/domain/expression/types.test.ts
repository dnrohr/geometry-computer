import {
  polynomialExpression,
  simplifiedPolynomialExpression,
} from "./examples";
import { formatExpression, formatExpressionLatex } from "./format";
import { add, constant, div, mul, pow, sqrt, sub, variable } from "./types";

describe("expression domain model", () => {
  it("formats the polynomial example as stable text", () => {
    expect(formatExpression(polynomialExpression)).toBe(
      "3 * a^2 + 4 * a * b + b^2",
    );
    expect(formatExpression(simplifiedPolynomialExpression)).toBe(
      "(3 * a + b) * (a + b)",
    );
  });

  it("formats the polynomial example as stable LaTeX", () => {
    expect(formatExpressionLatex(polynomialExpression)).toBe(
      "3 \\cdot a^{2} + 4 \\cdot a \\cdot b + b^{2}",
    );
  });

  it("constructs every supported expression kind", () => {
    const a = variable("a");
    const one = constant(1);
    expect(
      [
        add(a, one),
        sub(a, one),
        mul(a, one),
        div(a, one),
        pow(a, 2),
        sqrt(a),
      ].map((expression) => expression.kind),
    ).toEqual(["add", "sub", "mul", "div", "pow", "sqrt"]);
  });
});
