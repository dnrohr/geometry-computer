import { parseExpression } from "../../parser/parseExpression";
import { equalOrigami, rationalNumber } from "../algebra/origamiNumber";
import { analyzeOrigamiExpression } from "./analyzeExpression";

describe("analyzeOrigamiExpression", () => {
  it("preserves Euclidean arithmetic and radical classification", () => {
    const result = analyzeOrigamiExpression(parseExpression("sqrt(a)+b/2"), {
      a: 9,
      b: 4,
    });
    expect(result.classification).toBe("euclidean");
    expect(equalOrigami(result.value!, rationalNumber(5))).toBe(true);
  });

  it("evaluates cube roots exactly and marks them origami-only", () => {
    const result = analyzeOrigamiExpression(parseExpression("cbrt(2)"));
    expect(result.classification).toBe("origami-only");
    expect(result.value?.polynomial).toEqual([-2n, 0n, 0n, 1n]);
    expect(result.requiredOperations).toContain("cube-root");
  });

  it("evaluates mixed quadratic and cubic expressions", () => {
    const result = analyzeOrigamiExpression(
      parseExpression("cbrt(a)+sqrt(b)"),
      { a: 8, b: 9 },
    );
    expect(result.classification).toBe("origami-only");
    expect(equalOrigami(result.value!, rationalNumber(5))).toBe(true);
  });

  it("selects cubic real roots in ascending order", () => {
    // x^3 - 6x^2 + 11x - 6 has roots 1, 2, and 3.
    const middle = analyzeOrigamiExpression(
      parseExpression("cubic(1,-6,11,-6,1)"),
    );
    expect(middle.classification).toBe("origami-only");
    expect(equalOrigami(middle.value!, rationalNumber(2))).toBe(true);
  });

  it("reuses common subexpressions in its normalized DAG", () => {
    const result = analyzeOrigamiExpression(
      parseExpression("cbrt(a)+cbrt(a)"),
      {
        a: 8,
      },
    );
    expect(
      result.nodes.filter(({ expression }) => expression === "cbrt(a)"),
    ).toHaveLength(1);
  });

  it.each([
    ["a+1", {}, "MISSING_VARIABLE"],
    ["1/0", {}, "DIVISION_BY_ZERO"],
    ["sqrt(-1)", {}, "NON_REAL_ROOT"],
    ["cubic(0,1,1,1,0)", {}, "INVALID_CUBIC"],
    ["cubic(1,0,0,-1,1)", {}, "INVALID_ROOT_INDEX"],
  ])("rejects %s before planning", (source, variables, code) => {
    const result = analyzeOrigamiExpression(parseExpression(source), variables);
    expect(result.classification).toBe("invalid");
    expect(result.diagnostic?.code).toBe(code);
  });
});
