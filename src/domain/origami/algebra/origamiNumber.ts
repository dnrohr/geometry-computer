import { realPolynomialRoots } from "../polynomialRoots";
import { canonicalIntegerPolynomial, composePowerPolynomial, countDistinctRealRoots, fromIntegerPolynomial, gcdPolynomial, polynomialDegree, trimPolynomial, type RationalPolynomial } from "./polynomial";
import { constantYPolynomial, differenceSubstitution, productSubstitution, resultantY } from "./resultant";
import { compareR, equalR, numberR, powR, rational, rationalFromNumber, textR, type Rational } from "./rational";

export type AlgebraOperation = "rational" | "root" | "add" | "subtract" | "multiply" | "divide" | "negate" | "reciprocal" | "sqrt" | "cbrt";
export type AlgebraProvenance = { operation: AlgebraOperation; inputs: AlgebraProvenance[]; description: string };
export type OrigamiNumber = {
  polynomial: bigint[];
  interval: { lower: Rational; upper: Rational };
  approximation: number;
  provenance: AlgebraProvenance;
};

export const MAX_ALGEBRAIC_DEGREE = 12;
export const MAX_COEFFICIENT_BITS = 256;

const numericCoefficients = (polynomial: bigint[]) => polynomial.map(Number);
const validateComplexity = (polynomial: bigint[]) => {
  if (polynomial.length - 1 > MAX_ALGEBRAIC_DEGREE) throw new Error(`Algebraic degree ${polynomial.length - 1} exceeds the configured limit of ${MAX_ALGEBRAIC_DEGREE}.`);
  const bits = Math.max(...polynomial.map((value) => (value < 0n ? -value : value).toString(2).length));
  if (bits > MAX_COEFFICIENT_BITS) throw new Error(`An algebraic coefficient exceeds the configured ${MAX_COEFFICIENT_BITS}-bit limit.`);
};

function construct(polynomialInput: RationalPolynomial, approximation: number, provenance: AlgebraProvenance): OrigamiNumber {
  const polynomial = canonicalIntegerPolynomial(polynomialInput); validateComplexity(polynomial);
  const roots = realPolynomialRoots(numericCoefficients(polynomial));
  if (!roots.length) throw new Error("The defining polynomial has no real roots.");
  const ranked = roots.map((root, index) => ({ root, index, distance: Math.abs(root - approximation) })).sort((a, b) => a.distance - b.distance || a.index - b.index);
  if (ranked.length > 1 && Math.abs(ranked[0].distance - ranked[1].distance) < 1e-10) throw new Error("The requested algebraic root is ambiguous at the available isolation precision.");
  const selected = ranked[0]; const index = selected.index;
  const neighborGap = Math.min(index ? (selected.root - roots[index - 1]) / 3 : Infinity, index + 1 < roots.length ? (roots[index + 1] - selected.root) / 3 : Infinity);
  const localGap = Math.max(1, Math.abs(selected.root)) * 1e-6;
  const gap = Number.isFinite(neighborGap) ? Math.max(1e-10, Math.min(neighborGap, localGap)) : localGap;
  const interval = { lower: rationalFromNumber(selected.root - gap), upper: rationalFromNumber(selected.root + gap) };
  if (countDistinctRealRoots(fromIntegerPolynomial(polynomial), interval.lower, interval.upper) !== 1) throw new Error("Unable to certify a unique real root in the computed isolating interval.");
  return { polynomial, approximation: selected.root, interval, provenance };
}

export const rationalNumber = (value: Rational | bigint | number): OrigamiNumber => {
  const exact = typeof value === "object" ? value : rational(value);
  return { polynomial: [-exact.numerator, exact.denominator], approximation: numberR(exact), interval: { lower: exact, upper: exact }, provenance: { operation: "rational", inputs: [], description: textR(exact) } };
};

export const algebraicRoot = (polynomial: bigint[], rootIndex: number): OrigamiNumber => {
  const canonical = canonicalIntegerPolynomial(fromIntegerPolynomial(polynomial)); const roots = realPolynomialRoots(numericCoefficients(canonical));
  if (rootIndex < 0 || rootIndex >= roots.length) throw new Error(`Real root index ${rootIndex} is not available.`);
  return construct(fromIntegerPolynomial(canonical), roots[rootIndex], { operation: "root", inputs: [], description: `real root ${rootIndex + 1} of ${canonical.join(",")}` });
};

const asRational = (value: OrigamiNumber): Rational | undefined => value.polynomial.length === 2 ? rational(-value.polynomial[0], value.polynomial[1]) : undefined;
const translated = (polynomial: RationalPolynomial, amount: Rational) => {
  const result: RationalPolynomial = [rational(0)];
  polynomial.forEach((coefficient, power) => { for (let k = 0; k <= power; k++) { let choose = 1; for (let i = 1; i <= k; i++) choose = choose * (power - i + 1) / i; const term = coefficient.numerator === 0n ? rational(0) : { numerator: coefficient.numerator * BigInt(choose), denominator: coefficient.denominator }; const scaled = { numerator: term.numerator * powR({ numerator: -amount.numerator, denominator: amount.denominator }, power - k).numerator, denominator: term.denominator * powR({ numerator: -amount.numerator, denominator: amount.denominator }, power - k).denominator }; while (result.length <= k) result.push(rational(0)); result[k] = { numerator: result[k].numerator * scaled.denominator + scaled.numerator * result[k].denominator, denominator: result[k].denominator * scaled.denominator }; result[k] = rational(result[k].numerator, result[k].denominator); } });
  return trimPolynomial(result);
};

export function addOrigami(left: OrigamiNumber, right: OrigamiNumber): OrigamiNumber {
  const l = asRational(left); const r = asRational(right); const provenance = { operation: "add" as const, inputs: [left.provenance, right.provenance], description: "exact algebraic sum" };
  if (l) return construct(translated(fromIntegerPolynomial(right.polynomial), l), left.approximation + right.approximation, provenance);
  if (r) return construct(translated(fromIntegerPolynomial(left.polynomial), r), left.approximation + right.approximation, provenance);
  return construct(resultantY(constantYPolynomial(fromIntegerPolynomial(left.polynomial)), differenceSubstitution(fromIntegerPolynomial(right.polynomial))), left.approximation + right.approximation, provenance);
}
export const negateOrigami = (value: OrigamiNumber) => construct(fromIntegerPolynomial(value.polynomial).map((coefficient, index) => index % 2 ? { ...coefficient, numerator: -coefficient.numerator } : coefficient), -value.approximation, { operation: "negate", inputs: [value.provenance], description: "exact negation" });
export const subtractOrigami = (left: OrigamiNumber, right: OrigamiNumber) => { const result = addOrigami(left, negateOrigami(right)); return { ...result, provenance: { operation: "subtract", inputs: [left.provenance, right.provenance], description: "exact algebraic difference" } as AlgebraProvenance }; };

export function multiplyOrigami(left: OrigamiNumber, right: OrigamiNumber): OrigamiNumber {
  const l = asRational(left); const r = asRational(right); const provenance = { operation: "multiply" as const, inputs: [left.provenance, right.provenance], description: "exact algebraic product" };
  const scaleBy = (value: OrigamiNumber, amount: Rational) => { if (amount.numerator === 0n) return rationalNumber(0); const p = fromIntegerPolynomial(value.polynomial); const degree = polynomialDegree(p); return construct(p.map((coefficient, index) => ({ numerator: coefficient.numerator * powR(amount, degree - index).numerator, denominator: coefficient.denominator * powR(amount, degree - index).denominator })), value.approximation * numberR(amount), provenance); };
  if (l) return scaleBy(right, l); if (r) return scaleBy(left, r);
  return construct(resultantY(constantYPolynomial(fromIntegerPolynomial(left.polynomial)), productSubstitution(fromIntegerPolynomial(right.polynomial))), left.approximation * right.approximation, provenance);
}

export function reciprocalOrigami(value: OrigamiNumber): OrigamiNumber {
  if (value.interval.lower.numerator <= 0n && value.interval.upper.numerator >= 0n) throw new Error("Division by an algebraic value whose isolating interval contains zero is not supported.");
  return construct([...fromIntegerPolynomial(value.polynomial)].reverse(), 1 / value.approximation, { operation: "reciprocal", inputs: [value.provenance], description: "exact reciprocal" });
}
export const divideOrigami = (left: OrigamiNumber, right: OrigamiNumber) => { const result = multiplyOrigami(left, reciprocalOrigami(right)); return { ...result, provenance: { operation: "divide", inputs: [left.provenance, right.provenance], description: "exact algebraic quotient" } as AlgebraProvenance }; };
export const sqrtOrigami = (value: OrigamiNumber) => { if (value.approximation < 0) throw new Error("A real square root requires a nonnegative algebraic value."); return construct(composePowerPolynomial(fromIntegerPolynomial(value.polynomial), 2), Math.sqrt(value.approximation), { operation: "sqrt", inputs: [value.provenance], description: "nonnegative square root" }); };
export const cbrtOrigami = (value: OrigamiNumber) => construct(composePowerPolynomial(fromIntegerPolynomial(value.polynomial), 3), Math.cbrt(value.approximation), { operation: "cbrt", inputs: [value.provenance], description: "real cube root" });

export function equalOrigami(left: OrigamiNumber, right: OrigamiNumber) {
  const leftRational = asRational(left); const rightRational = asRational(right);
  if (leftRational && rightRational) return compareR(leftRational, rightRational) === 0;
  const common = gcdPolynomial(fromIntegerPolynomial(left.polynomial), fromIntegerPolynomial(right.polynomial));
  if (polynomialDegree(common) === 0) return false;
  const overlapLower = compareR(left.interval.lower, right.interval.lower) > 0 ? left.interval.lower : right.interval.lower;
  const overlapUpper = compareR(left.interval.upper, right.interval.upper) < 0 ? left.interval.upper : right.interval.upper;
  if (compareR(overlapLower, overlapUpper) > 0) return false;
  return realPolynomialRoots(common.map((coefficient) => numberR(coefficient))).some((root) => root >= numberR(overlapLower) && root <= numberR(overlapUpper));
}
export function compareOrigami(left: OrigamiNumber, right: OrigamiNumber) { if (equalOrigami(left, right)) return 0; if (compareR(left.interval.upper, right.interval.lower) < 0) return -1; if (compareR(left.interval.lower, right.interval.upper) > 0) return 1; throw new Error("The current isolating intervals are insufficient to certify this comparison."); }
export const exactText = (value: OrigamiNumber) => asRational(value) ? textR(asRational(value)!) : `root of ${value.polynomial.map(String).join(", ")} in (${textR(value.interval.lower)}, ${textR(value.interval.upper)})`;
export const decimalText = (value: OrigamiNumber, digits = 10) => Number(value.approximation.toPrecision(digits)).toString();
export const symbolicText = (value: OrigamiNumber): string => {
  const render = (node: AlgebraProvenance): string => {
    if (node.operation === "rational" || node.operation === "root") return node.description;
    if (node.operation === "negate") return `-(${render(node.inputs[0])})`;
    if (node.operation === "reciprocal") return `1/(${render(node.inputs[0])})`;
    if (node.operation === "sqrt" || node.operation === "cbrt") return `${node.operation}(${render(node.inputs[0])})`;
    const symbols: Partial<Record<AlgebraOperation, string>> = { add: "+", subtract: "−", multiply: "×", divide: "/" };
    return `(${render(node.inputs[0])} ${symbols[node.operation] ?? node.operation} ${render(node.inputs[1])})`;
  };
  return render(value.provenance);
};
export const serializeOrigamiNumber = (value: OrigamiNumber) => JSON.stringify({ schema: "geometry-computer/origami-number", version: 1, polynomial: value.polynomial.map(String), interval: { lower: [value.interval.lower.numerator.toString(), value.interval.lower.denominator.toString()], upper: [value.interval.upper.numerator.toString(), value.interval.upper.denominator.toString()] }, provenance: value.provenance });
export const parseOrigamiNumber = (source: string): OrigamiNumber => { const data = JSON.parse(source) as { schema: string; version: number; polynomial: string[]; interval: { lower: [string, string]; upper: [string, string] }; provenance: AlgebraProvenance }; if (data.schema !== "geometry-computer/origami-number" || data.version !== 1) throw new Error("Unsupported origami-number document."); const polynomial = data.polynomial.map(BigInt); const lower = rational(BigInt(data.interval.lower[0]), BigInt(data.interval.lower[1])); const upper = rational(BigInt(data.interval.upper[0]), BigInt(data.interval.upper[1])); validateComplexity(polynomial); if (polynomial.length === 2) { const exact = rational(-polynomial[0], polynomial[1]); if (!equalR(lower, exact) || !equalR(upper, exact)) throw new Error("Serialized rational interval does not equal its exact root."); return { polynomial, interval: { lower, upper }, approximation: numberR(exact), provenance: data.provenance }; } if (countDistinctRealRoots(fromIntegerPolynomial(polynomial), lower, upper) !== 1) throw new Error("Serialized isolating interval does not certify exactly one real root."); const roots = realPolynomialRoots(numericCoefficients(polynomial)).filter((root) => root > numberR(lower) && root < numberR(upper)); return { polynomial, interval: { lower, upper }, approximation: roots[0], provenance: data.provenance }; };
