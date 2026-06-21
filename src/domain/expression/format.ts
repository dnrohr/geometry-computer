import type { Expr } from "./types";

const precedence: Record<Expr["kind"], number> = {
  add: 1,
  sub: 1,
  mul: 2,
  div: 2,
  pow: 3,
  sqrt: 4,
  const: 4,
  var: 4,
};

function format(expr: Expr, latex: boolean, parentPrecedence = 0): string {
  const ownPrecedence = precedence[expr.kind];
  let result: string;

  switch (expr.kind) {
    case "const":
      result = String(expr.value);
      break;
    case "var":
      result = expr.name;
      break;
    case "add":
      result = `${format(expr.left, latex, ownPrecedence)} + ${format(expr.right, latex, ownPrecedence)}`;
      break;
    case "sub":
      result = `${format(expr.left, latex, ownPrecedence)} - ${format(expr.right, latex, ownPrecedence + 1)}`;
      break;
    case "mul": {
      const separator = latex ? " \\cdot " : " * ";
      result = `${format(expr.left, latex, ownPrecedence)}${separator}${format(expr.right, latex, ownPrecedence)}`;
      break;
    }
    case "div":
      result = latex
        ? `\\frac{${format(expr.left, latex)}}{${format(expr.right, latex)}}`
        : `${format(expr.left, latex, ownPrecedence)} / ${format(expr.right, latex, ownPrecedence + 1)}`;
      break;
    case "pow":
      result = latex
        ? `${format(expr.base, latex, ownPrecedence)}^{${expr.exponent}}`
        : `${format(expr.base, latex, ownPrecedence)}^${expr.exponent}`;
      break;
    case "sqrt":
      result = latex
        ? `\\sqrt{${format(expr.value, latex)}}`
        : `sqrt(${format(expr.value, latex)})`;
      break;
  }

  if (ownPrecedence < parentPrecedence) {
    return latex ? `\\left(${result}\\right)` : `(${result})`;
  }
  return result;
}

export const formatExpression = (expr: Expr): string => format(expr, false);
export const formatExpressionLatex = (expr: Expr): string => format(expr, true);
