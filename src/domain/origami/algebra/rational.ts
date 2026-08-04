export type Rational = { numerator: bigint; denominator: bigint };

const gcd = (left: bigint, right: bigint): bigint => {
  let a = left < 0n ? -left : left;
  let b = right < 0n ? -right : right;
  while (b) [a, b] = [b, a % b];
  return a || 1n;
};

export function rational(
  numerator: bigint | number,
  denominator: bigint | number = 1n,
): Rational {
  let n = BigInt(numerator);
  let d = BigInt(denominator);
  if (d === 0n) throw new Error("A rational denominator cannot be zero.");
  if (d < 0n) {
    n = -n;
    d = -d;
  }
  const factor = gcd(n, d);
  return { numerator: n / factor, denominator: d / factor };
}
export const addR = (a: Rational, b: Rational) =>
  rational(
    a.numerator * b.denominator + b.numerator * a.denominator,
    a.denominator * b.denominator,
  );
export const subR = (a: Rational, b: Rational) =>
  rational(
    a.numerator * b.denominator - b.numerator * a.denominator,
    a.denominator * b.denominator,
  );
export const mulR = (a: Rational, b: Rational) =>
  rational(a.numerator * b.numerator, a.denominator * b.denominator);
export const divR = (a: Rational, b: Rational) => {
  if (b.numerator === 0n) throw new Error("Division by zero.");
  return rational(a.numerator * b.denominator, a.denominator * b.numerator);
};
export const negR = (value: Rational) =>
  rational(-value.numerator, value.denominator);
export const compareR = (a: Rational, b: Rational) =>
  a.numerator * b.denominator < b.numerator * a.denominator
    ? -1
    : a.numerator * b.denominator > b.numerator * a.denominator
      ? 1
      : 0;
export const equalR = (a: Rational, b: Rational) =>
  a.numerator === b.numerator && a.denominator === b.denominator;
export const isZeroR = (value: Rational) => value.numerator === 0n;
export const numberR = (value: Rational) =>
  Number(value.numerator) / Number(value.denominator);
export const textR = (value: Rational) =>
  value.denominator === 1n
    ? value.numerator.toString()
    : `${value.numerator}/${value.denominator}`;
export const powR = (value: Rational, power: number): Rational =>
  power < 0
    ? powR(divR(rational(1), value), -power)
    : rational(
        value.numerator ** BigInt(power),
        value.denominator ** BigInt(power),
      );

export function rationalFromNumber(
  value: number,
  denominatorPower = 42,
): Rational {
  if (!Number.isFinite(value))
    throw new Error(
      "Cannot convert a non-finite number to a rational interval bound.",
    );
  const denominator = 1n << BigInt(denominatorPower);
  return rational(BigInt(Math.round(value * Number(denominator))), denominator);
}

/** Converts the finite decimal spelling of a number to an exact rational. */
export function rationalFromDecimal(value: number | string): Rational {
  const source = String(value).toLowerCase();
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/.test(source))
    throw new Error(
      "Cannot convert a non-finite decimal to an exact rational.",
    );
  const [mantissa, exponentText = "0"] = source.split("e");
  const negative = mantissa.startsWith("-");
  const unsigned = mantissa.replace(/^[+-]/, "");
  const [whole, fraction = ""] = unsigned.split(".");
  const digits = BigInt(`${whole || "0"}${fraction}`);
  const exponent = Number(exponentText) - fraction.length;
  const magnitude = 10n ** BigInt(Math.abs(exponent));
  return exponent >= 0
    ? rational((negative ? -digits : digits) * magnitude)
    : rational(negative ? -digits : digits, magnitude);
}
