import { addR, divR, mulR, rational, textR } from "./rational";
import { canonicalIntegerPolynomial, fromIntegerPolynomial, gcdPolynomial } from "./polynomial";

describe("exact rational and polynomial arithmetic", () => {
  it("normalizes signs and common factors", () => {
    expect(rational(6n, -8n)).toEqual({ numerator: -3n, denominator: 4n });
    expect(textR(addR(rational(1, 3), rational(1, 6)))).toBe("1/2");
    expect(mulR(rational(2, 3), rational(9, 4))).toEqual(rational(3, 2));
    expect(divR(rational(3, 5), rational(9, 10))).toEqual(rational(2, 3));
  });

  it("canonicalizes integer polynomials and computes exact gcds", () => {
    expect(canonicalIntegerPolynomial([rational(-1, 2), rational(0), rational(1, 2)])).toEqual([-1n, 0n, 1n]);
    expect(canonicalIntegerPolynomial(gcdPolynomial(fromIntegerPolynomial([-2n, 0n, 1n]), fromIntegerPolynomial([4n, 0n, -4n, 0n, 1n])))).toEqual([-2n, 0n, 1n]);
  });
});
