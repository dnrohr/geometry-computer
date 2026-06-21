import type { Expr } from "./types";

export type NormalizedExpression = { original: Expr; normalized: Expr };

export function simplify(expr: Expr): Expr {
  if (expr.kind === "const" || expr.kind === "var") return expr;
  if (expr.kind === "sqrt") {
    const value = simplify(expr.value);
    return value.kind === "const" && value.value >= 0
      ? { kind: "const", value: Math.sqrt(value.value) }
      : { ...expr, value };
  }
  if (expr.kind === "pow") {
    const base = simplify(expr.base);
    return base.kind === "const"
      ? { kind: "const", value: base.value ** expr.exponent }
      : { ...expr, base };
  }
  const left = simplify(expr.left);
  const right = simplify(expr.right);
  if (left.kind === "const" && right.kind === "const") {
    const values = {
      add: left.value + right.value,
      sub: left.value - right.value,
      mul: left.value * right.value,
      div: left.value / right.value,
    };
    return { kind: "const", value: values[expr.kind] };
  }
  return { ...expr, left, right };
}

export const normalize = (original: Expr): NormalizedExpression => ({
  original,
  normalized: simplify(original),
});
