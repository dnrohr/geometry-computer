import {
  addR,
  divR,
  isZeroR,
  mulR,
  negR,
  rational,
  type Rational,
} from "./rational";

export type RationalPolynomial = Rational[];
const zero = () => rational(0);
export const trimPolynomial = (input: RationalPolynomial) => {
  const result = [...input];
  while (result.length > 1 && isZeroR(result.at(-1)!)) result.pop();
  return result.length ? result : [zero()];
};
export const polynomialDegree = (value: RationalPolynomial) =>
  trimPolynomial(value).length - 1;
export const addPolynomial = (a: RationalPolynomial, b: RationalPolynomial) =>
  trimPolynomial(
    Array.from({ length: Math.max(a.length, b.length) }, (_, index) =>
      addR(a[index] ?? zero(), b[index] ?? zero()),
    ),
  );
export const subtractPolynomial = (
  a: RationalPolynomial,
  b: RationalPolynomial,
) => addPolynomial(a, b.map(negR));
export const scalePolynomial = (a: RationalPolynomial, amount: Rational) =>
  trimPolynomial(a.map((value) => mulR(value, amount)));
export const multiplyPolynomial = (
  a: RationalPolynomial,
  b: RationalPolynomial,
) => {
  const result = Array.from({ length: a.length + b.length - 1 }, zero);
  a.forEach((left, i) =>
    b.forEach((right, j) => {
      result[i + j] = addR(result[i + j], mulR(left, right));
    }),
  );
  return trimPolynomial(result);
};
export const evaluateRationalPolynomial = (
  coefficients: RationalPolynomial,
  value: Rational,
) =>
  coefficients.reduceRight(
    (result, coefficient) => addR(mulR(result, value), coefficient),
    zero(),
  );
export const derivativePolynomial = (value: RationalPolynomial) =>
  value.length <= 1
    ? [zero()]
    : trimPolynomial(
        value
          .slice(1)
          .map((coefficient, index) => mulR(coefficient, rational(index + 1))),
      );

export function dividePolynomial(
  dividendInput: RationalPolynomial,
  divisorInput: RationalPolynomial,
) {
  let remainder = trimPolynomial(dividendInput);
  const divisor = trimPolynomial(divisorInput);
  if (polynomialDegree(divisor) === 0 && isZeroR(divisor[0]))
    throw new Error("Polynomial division by zero.");
  const quotient = Array.from(
    {
      length: Math.max(
        1,
        polynomialDegree(remainder) - polynomialDegree(divisor) + 1,
      ),
    },
    zero,
  );
  while (
    !(polynomialDegree(remainder) === 0 && isZeroR(remainder[0])) &&
    polynomialDegree(remainder) >= polynomialDegree(divisor)
  ) {
    const shift = polynomialDegree(remainder) - polynomialDegree(divisor);
    const factor = divR(remainder.at(-1)!, divisor.at(-1)!);
    quotient[shift] = factor;
    const term = Array.from({ length: shift }, zero).concat(
      scalePolynomial(divisor, factor),
    );
    remainder = trimPolynomial(subtractPolynomial(remainder, term));
  }
  return { quotient: trimPolynomial(quotient), remainder };
}

export function gcdPolynomial(
  aInput: RationalPolynomial,
  bInput: RationalPolynomial,
): RationalPolynomial {
  let a = trimPolynomial(aInput);
  let b = trimPolynomial(bInput);
  while (!(polynomialDegree(b) === 0 && isZeroR(b[0])))
    [a, b] = [b, dividePolynomial(a, b).remainder];
  return scalePolynomial(a, divR(rational(1), a.at(-1)!));
}

export function countDistinctRealRoots(
  polynomialInput: RationalPolynomial,
  lower: Rational,
  upper: Rational,
) {
  const polynomial = trimPolynomial(polynomialInput);
  const common = gcdPolynomial(polynomial, derivativePolynomial(polynomial));
  const squareFree = dividePolynomial(polynomial, common).quotient;
  const sequence: RationalPolynomial[] = [
    squareFree,
    derivativePolynomial(squareFree),
  ];
  while (
    !(polynomialDegree(sequence.at(-1)!) === 0 && isZeroR(sequence.at(-1)![0]))
  ) {
    const remainder = dividePolynomial(
      sequence.at(-2)!,
      sequence.at(-1)!,
    ).remainder;
    if (polynomialDegree(remainder) === 0 && isZeroR(remainder[0])) break;
    sequence.push(scalePolynomial(remainder, rational(-1)));
  }
  const variations = (point: Rational) => {
    const signs = sequence
      .map((item) => evaluateRationalPolynomial(item, point).numerator)
      .filter((value) => value !== 0n)
      .map((value) => (value < 0n ? -1 : 1));
    return signs
      .slice(1)
      .reduce((count, sign, index) => count + Number(sign !== signs[index]), 0);
  };
  return variations(lower) - variations(upper);
}

export const composePowerPolynomial = (
  polynomial: RationalPolynomial,
  power: number,
) => {
  const result = Array.from(
    { length: polynomialDegree(polynomial) * power + 1 },
    zero,
  );
  polynomial.forEach((coefficient, index) => {
    result[index * power] = coefficient;
  });
  return trimPolynomial(result);
};

const bigintGcd = (a: bigint, b: bigint): bigint => {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y) [x, y] = [y, x % y];
  return x || 1n;
};
const bigintLcm = (a: bigint, b: bigint) => (a / bigintGcd(a, b)) * b;
export function canonicalIntegerPolynomial(
  input: RationalPolynomial,
): bigint[] {
  const polynomial = trimPolynomial(input);
  const commonDenominator = polynomial.reduce(
    (value, coefficient) => bigintLcm(value, coefficient.denominator),
    1n,
  );
  let integers = polynomial.map(
    (coefficient) =>
      coefficient.numerator * (commonDenominator / coefficient.denominator),
  );
  const commonFactor = integers.reduce(bigintGcd, 0n);
  integers = integers.map((value) => value / commonFactor);
  if (integers.at(-1)! < 0n) integers = integers.map((value) => -value);
  return integers;
}
export const fromIntegerPolynomial = (values: bigint[]) =>
  trimPolynomial(values.map((value) => rational(value)));
