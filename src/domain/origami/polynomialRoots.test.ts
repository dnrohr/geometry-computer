import { evaluatePolynomial, realPolynomialRoots } from "./polynomialRoots";

describe("certified-degree real root isolation", () => {
  it.each([
    [[-2, 1], [2]],
    [[1, -2, 1], [1]],
    [[-2, 5, -4, 1], [1, 1, 2]],
    [[-6, 11, -6, 1], [1, 2, 3]],
  ] as [number[], number[]][])("isolates roots of %j", (polynomial, expected) => {
    const roots = realPolynomialRoots(polynomial);
    expect(roots).toHaveLength(new Set(expected).size);
    [...new Set(expected)].forEach((value, index) => expect(roots[index]).toBeCloseTo(value, 8));
    roots.forEach((root) => expect(Math.abs(evaluatePolynomial(polynomial, root))).toBeLessThan(1e-8));
  });

  it("isolates higher-degree roots used by composed algebraic operations", () => {
    realPolynomialRoots([4, 0, -5, 0, 1]).forEach((root, index) => expect(root).toBeCloseTo([-2, -1, 1, 2][index], 8));
  });
});
