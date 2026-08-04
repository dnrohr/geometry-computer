const EPSILON = 1e-12;

export const evaluatePolynomial = (coefficients: number[], x: number) =>
  coefficients.reduceRight((value, coefficient) => value * x + coefficient, 0);

const normalized = (coefficients: number[]) => {
  const result = [...coefficients];
  while (result.length > 1 && Math.abs(result.at(-1)!) <= EPSILON) result.pop();
  return result;
};

const deduplicate = (values: number[]) =>
  values
    .sort((a, b) => a - b)
    .filter(
      (value, index, sorted) =>
        index === 0 || Math.abs(value - sorted[index - 1]) > 1e-8,
    );

export function realPolynomialRoots(input: number[]): number[] {
  const coefficients = normalized(input);
  const degree = coefficients.length - 1;
  if (degree <= 0) return [];
  if (degree === 1) return [-coefficients[0] / coefficients[1]];
  if (degree === 2) {
    const [c, b, a] = coefficients;
    const discriminant = b * b - 4 * a * c;
    if (discriminant < -EPSILON) return [];
    if (Math.abs(discriminant) <= EPSILON) return [-b / (2 * a)];
    const root = Math.sqrt(discriminant);
    return deduplicate([(-b - root) / (2 * a), (-b + root) / (2 * a)]);
  }
  const leading = coefficients[degree];
  const bound =
    1 +
    Math.max(
      ...coefficients
        .slice(0, degree)
        .map((value) => Math.abs(value / leading)),
    );
  const critical = realPolynomialRoots(
    coefficients.slice(1).map((value, index) => value * (index + 1)),
  ).filter((value) => value > -bound && value < bound);
  const points = [-bound, ...critical, bound];
  const roots: number[] = [];
  const scale = Math.max(1, ...coefficients.map(Math.abs));
  for (const point of critical)
    if (Math.abs(evaluatePolynomial(coefficients, point)) <= 1e-9 * scale)
      roots.push(point);
  for (let index = 0; index < points.length - 1; index++) {
    let left = points[index];
    let right = points[index + 1];
    let leftValue = evaluatePolynomial(coefficients, left);
    const rightValue = evaluatePolynomial(coefficients, right);
    if (Math.abs(leftValue) <= 1e-10 * scale) roots.push(left);
    if (leftValue * rightValue >= 0) continue;
    for (let iteration = 0; iteration < 100; iteration++) {
      const middle = (left + right) / 2;
      const value = evaluatePolynomial(coefficients, middle);
      if (Math.abs(value) <= 1e-13 * scale || right - left <= 1e-12) {
        left = right = middle;
        break;
      }
      if (leftValue * value <= 0) right = middle;
      else {
        left = middle;
        leftValue = value;
      }
    }
    roots.push((left + right) / 2);
  }
  return deduplicate(roots);
}
