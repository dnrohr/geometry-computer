import {
  addPolynomial,
  multiplyPolynomial,
  scalePolynomial,
  trimPolynomial,
  type RationalPolynomial,
} from "./polynomial";
import { rational, type Rational } from "./rational";

type PolyX = RationalPolynomial;
type PolyY = PolyX[];
const zero = (): PolyX => [rational(0)];
const one = (): PolyX => [rational(1)];

function determinant(matrix: PolyX[][]): PolyX {
  if (matrix.length === 0) return one();
  if (matrix.length === 1) return matrix[0][0];
  let result = zero();
  matrix[0].forEach((entry, column) => {
    const minor = matrix
      .slice(1)
      .map((row) => row.filter((_, index) => index !== column));
    const term = multiplyPolynomial(entry, determinant(minor));
    result = addPolynomial(
      result,
      column % 2 ? scalePolynomial(term, rational(-1)) : term,
    );
  });
  return result;
}

export function resultantY(first: PolyY, second: PolyY): PolyX {
  const n = first.length - 1;
  const m = second.length - 1;
  const size = n + m;
  if (size > 8)
    throw new Error(
      `Resultant matrix size ${size} exceeds the configured exact-algebra limit of 8.`,
    );
  const descendingFirst = [...first].reverse();
  const descendingSecond = [...second].reverse();
  const matrix: PolyX[][] = [];
  for (let row = 0; row < m; row++)
    matrix.push(
      Array.from({ length: size }, (_, column) =>
        column >= row && column - row < descendingFirst.length
          ? descendingFirst[column - row]
          : zero(),
      ),
    );
  for (let row = 0; row < n; row++)
    matrix.push(
      Array.from({ length: size }, (_, column) =>
        column >= row && column - row < descendingSecond.length
          ? descendingSecond[column - row]
          : zero(),
      ),
    );
  return trimPolynomial(determinant(matrix));
}

const binomial = (n: number, k: number) => {
  let value = 1;
  for (let index = 1; index <= k; index++)
    value = (value * (n - index + 1)) / index;
  return value;
};

/** q(x-y), represented as coefficients in y whose entries are polynomials in x. */
export function differenceSubstitution(polynomial: RationalPolynomial): PolyY {
  const result: PolyY = Array.from({ length: polynomial.length }, zero);
  polynomial.forEach((coefficient, power) => {
    for (let yPower = 0; yPower <= power; yPower++) {
      const xPower = power - yPower;
      const scalar = scalePolynomial(
        [coefficient],
        rational(BigInt(binomial(power, yPower) * (yPower % 2 ? -1 : 1))),
      );
      const term = Array.from({ length: xPower }, () => rational(0)).concat(
        scalar,
      );
      result[yPower] = addPolynomial(result[yPower], term);
    }
  });
  return result;
}

/** y^m q(x/y), represented as coefficients in y. */
export function productSubstitution(polynomial: RationalPolynomial): PolyY {
  const degree = polynomial.length - 1;
  const result: PolyY = Array.from({ length: degree + 1 }, zero);
  polynomial.forEach((coefficient, xPower) => {
    result[degree - xPower] = Array.from({ length: xPower }, () =>
      rational(0),
    ).concat([coefficient]);
  });
  return result;
}

export const constantYPolynomial = (polynomial: RationalPolynomial): PolyY =>
  polynomial.map((coefficient: Rational) => [coefficient]);
