import { parseExpression } from "../../parser/parseExpression";
import {
  origamiAllowableFieldSummary,
  validateOrigamiAllowableField,
} from "./allowableField";

describe("origami allowable function field", () => {
  it("accepts sampled constructible-field expressions from supported operations", () => {
    const report = validateOrigamiAllowableField(
      parseExpression("sqrt((a+b)^2/(c+1))"),
      { a: 3, b: 2, c: 4 },
    );

    expect(report).toMatchObject({
      allowed: true,
      variables: ["a", "b", "c"],
      issues: [],
    });
    expect(report.value).toBe(Math.sqrt(5));
  });

  it("reports missing and nonfinite sampled variable values", () => {
    const missing = validateOrigamiAllowableField(parseExpression("a+b"), {
      a: 1,
    });
    const nonfinite = validateOrigamiAllowableField(parseExpression("a"), {
      a: Number.POSITIVE_INFINITY,
    });

    expect(missing.allowed).toBe(false);
    expect(missing.issues).toContainEqual(
      expect.objectContaining({
        code: "MISSING_VARIABLE",
        expression: "b",
      }),
    );
    expect(nonfinite.issues).toContainEqual(
      expect.objectContaining({
        code: "NONFINITE_VALUE",
        expression: "a",
      }),
    );
  });

  it("rejects division by zero and negative square-root samples", () => {
    const division = validateOrigamiAllowableField(parseExpression("a/(b-b)"), {
      a: 3,
      b: 2,
    });
    const squareRoot = validateOrigamiAllowableField(
      parseExpression("sqrt(a-b)"),
      { a: 1, b: 2 },
    );

    expect(division.allowed).toBe(false);
    expect(division.issues).toContainEqual(
      expect.objectContaining({
        code: "DIVISION_BY_ZERO",
        message: expect.stringMatching(/outside the sampled origami/i),
      }),
    );
    expect(squareRoot.allowed).toBe(false);
    expect(squareRoot.issues).toContainEqual(
      expect.objectContaining({
        code: "NEGATIVE_SQUARE_ROOT",
        expression: "a - b",
      }),
    );
  });

  it("keeps unsupported power diagnostics origami-specific", () => {
    const report = validateOrigamiAllowableField(
      {
        kind: "pow",
        base: { kind: "var", name: "a" },
        exponent: -1,
      },
      { a: 2 },
    );

    expect(report.allowed).toBe(false);
    expect(report.issues).toEqual([
      expect.objectContaining({
        code: "UNSUPPORTED_POWER",
        message: expect.stringMatching(/Origami function powers/i),
      }),
    ]);
  });

  it("documents the operations that define F0.1", () => {
    expect(origamiAllowableFieldSummary).toEqual([
      "variables",
      "finite rational or decimal constants",
      "addition and subtraction",
      "multiplication and division with nonzero sampled denominators",
      "nonnegative integer powers supported by the parser",
      "square roots with nonnegative sampled radicands",
      "composition of supported expressions",
    ]);
  });
});
