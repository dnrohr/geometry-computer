import { addOrigami, algebraicRoot, cbrtOrigami, compareOrigami, decimalText, divideOrigami, equalOrigami, exactText, multiplyOrigami, parseOrigamiNumber, rationalNumber, serializeOrigamiNumber, sqrtOrigami, subtractOrigami, symbolicText } from "./origamiNumber";

describe("OrigamiNumber", () => {
  const two = rationalNumber(2);
  const sqrtTwo = sqrtOrigami(two);
  const cubeRootTwo = cbrtOrigami(two);

  it("represents rational, quadratic, and cubic values canonically", () => {
    expect(two.polynomial).toEqual([-2n, 1n]);
    expect(sqrtTwo.polynomial).toEqual([-2n, 0n, 1n]);
    expect(cubeRootTwo.polynomial).toEqual([-2n, 0n, 0n, 1n]);
    expect(sqrtTwo.approximation).toBeCloseTo(Math.sqrt(2), 10);
    expect(cubeRootTwo.approximation).toBeCloseTo(Math.cbrt(2), 10);
  });

  it("performs exact field operations without decimal equality", () => {
    expect(equalOrigami(multiplyOrigami(sqrtTwo, sqrtTwo), two)).toBe(true);
    expect(equalOrigami(subtractOrigami(addOrigami(sqrtTwo, rationalNumber(3)), rationalNumber(3)), sqrtTwo)).toBe(true);
    expect(equalOrigami(divideOrigami(multiplyOrigami(cubeRootTwo, rationalNumber(5)), rationalNumber(5)), cubeRootTwo)).toBe(true);
    expect(compareOrigami(sqrtTwo, two)).toBe(-1);
  });

  it("constructs a mixed quadratic/cubic extension with operation provenance", () => {
    const mixed = addOrigami(sqrtTwo, cubeRootTwo);
    expect(mixed.polynomial.length - 1).toBe(6);
    expect(mixed.approximation).toBeCloseTo(Math.sqrt(2) + Math.cbrt(2), 8);
    expect(mixed.provenance.operation).toBe("add");
    expect(exactText(mixed)).toContain("root of");
    expect(symbolicText(mixed)).toBe("(sqrt(2) + cbrt(2))");
    expect(decimalText(mixed)).toBe(Number((Math.sqrt(2) + Math.cbrt(2)).toPrecision(10)).toString());
  });

  it("recognizes a common exact root of different defining polynomials", () => {
    const repeatedDefinition = algebraicRoot([4n, 0n, -4n, 0n, 1n], 1);
    expect(equalOrigami(sqrtTwo, repeatedDefinition)).toBe(true);
  });

  it("round trips canonical serialization", () => {
    const restored = parseOrigamiNumber(serializeOrigamiNumber(cubeRootTwo));
    expect(restored.polynomial).toEqual(cubeRootTwo.polynomial);
    expect(equalOrigami(restored, cubeRootTwo)).toBe(true);
    expect(parseOrigamiNumber(serializeOrigamiNumber(two)).polynomial).toEqual(two.polynomial);
  });

  it("rejects non-real roots, zero division, and configured complexity excess", () => {
    expect(() => sqrtOrigami(rationalNumber(-1))).toThrow(/nonnegative/i);
    expect(() => divideOrigami(two, rationalNumber(0))).toThrow(/zero/i);
    expect(() => cbrtOrigami(addOrigami(sqrtTwo, cubeRootTwo))).toThrow(/degree/i);
    expect(() => algebraicRoot([1n << 300n, 1n], 0)).toThrow(/bit limit/i);
  });
});
