import { add, constant, mul, pow, variable } from "./types";

const a = variable("a");
const b = variable("b");

export const polynomialExpression = add(
  add(mul(constant(3), pow(a, 2)), mul(constant(4), mul(a, b))),
  pow(b, 2),
);

export const simplifiedPolynomialExpression = mul(
  add(mul(constant(3), a), b),
  add(a, b),
);
