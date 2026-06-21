import { normalize, simplify } from "./simplify";
import { add, constant, pow, variable } from "./types";

describe("expression normalization", () => {
  it("preserves the original expression and a square candidate", () => {
    const original = pow(variable("x"), 2);
    const result = normalize(original);
    expect(result.original).toBe(original);
    expect(result.normalized).toEqual(original);
  });

  it("folds simple numeric constants", () => {
    expect(simplify(add(constant(2), constant(3)))).toEqual(constant(5));
  });
});
