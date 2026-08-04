import { rationalNumber } from "../algebra/origamiNumber";
import { rational } from "../algebra/rational";
import { instantiateConstructionTemplate, verifyTemplate } from "./constructionTemplates";

describe("origami construction templates", () => {
  it.each([
    [{ operation: "unit" } as const, 1],
    [{ operation: "add", left: rationalNumber(2), right: rationalNumber(3) } as const, 5],
    [{ operation: "subtract", left: rationalNumber(3), right: rationalNumber(2) } as const, 1],
    [{ operation: "multiply", left: rationalNumber(2), right: rationalNumber(rational(3, 2)) } as const, 3],
    [{ operation: "reciprocal", value: rationalNumber(2) } as const, 0.5],
    [{ operation: "divide", left: rationalNumber(3), right: rationalNumber(2) } as const, 1.5],
    [{ operation: "square-root", value: rationalNumber(4) } as const, 2],
  ])("certifies the $operation template", (request, expected) => {
    const template = instantiateConstructionTemplate(request);
    expect(template.output.approximation).toBeCloseTo(expected);
    expect(verifyTemplate(template).valid).toBe(true);
    expect(template.proofClaims.length).toBeGreaterThan(1);
  });

  it("maps a cube root to a certified O6 crease", () => {
    const template = instantiateConstructionTemplate({ operation: "cube-root", value: rationalNumber(2) });
    expect(template.requiredAxioms).toEqual(["O6"]);
    expect(template.folds[0].candidate.rootParameter).toBeCloseTo(Math.cbrt(2));
    expect(verifyTemplate(template).valid).toBe(true);
  });

  it("selects the requested branch of a three-real-root cubic", () => {
    const template = instantiateConstructionTemplate({
      operation: "cubic-root",
      coefficients: [-6n, 11n, -6n, 1n],
      rootIndex: 1,
    });
    expect(template.output.approximation).toBeCloseTo(2);
    expect(template.folds[0].rejectedCandidates).toHaveLength(2);
    expect(template.folds[0].candidate.rootParameter).toBeCloseTo(2);
  });

  it("rejects layouts outside the safe paper region", () => {
    expect(() => instantiateConstructionTemplate({ operation: "add", left: rationalNumber(80), right: rationalNumber(80) })).toThrow(/paper bounds/i);
  });
});
