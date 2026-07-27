import { formatExpression } from "../../expression/format";
import type { Expr } from "../../expression/types";

export type OrigamiFunctionSimplificationHint = {
  id: string;
  expression: string;
  replacement: string;
  reason:
    | "add-zero"
    | "subtract-zero"
    | "multiply-one"
    | "multiply-zero"
    | "divide-one"
    | "constant-fold";
  summary: string;
};

const isConst = (expr: Expr, value: number) =>
  expr.kind === "const" && expr.value === value;

const constantValue = (expr: Expr): number | undefined =>
  expr.kind === "const" ? expr.value : undefined;

const hint = (
  hints: OrigamiFunctionSimplificationHint[],
  reason: OrigamiFunctionSimplificationHint["reason"],
  expr: Expr,
  replacement: Expr | number,
  summary: string,
) => {
  hints.push({
    id: `origami-function-simplification-${hints.length + 1}`,
    expression: formatExpression(expr),
    replacement:
      typeof replacement === "number"
        ? String(replacement)
        : formatExpression(replacement),
    reason,
    summary,
  });
};

const visit = (expr: Expr, hints: OrigamiFunctionSimplificationHint[]) => {
  switch (expr.kind) {
    case "add":
      visit(expr.left, hints);
      visit(expr.right, hints);
      if (isConst(expr.left, 0)) {
        hint(
          hints,
          "add-zero",
          expr,
          expr.right,
          "Adding zero can be skipped.",
        );
      } else if (isConst(expr.right, 0)) {
        hint(hints, "add-zero", expr, expr.left, "Adding zero can be skipped.");
      }
      break;
    case "sub":
      visit(expr.left, hints);
      visit(expr.right, hints);
      if (isConst(expr.right, 0)) {
        hint(
          hints,
          "subtract-zero",
          expr,
          expr.left,
          "Subtracting zero can be skipped.",
        );
      }
      break;
    case "mul":
      visit(expr.left, hints);
      visit(expr.right, hints);
      if (isConst(expr.left, 0) || isConst(expr.right, 0)) {
        hint(
          hints,
          "multiply-zero",
          expr,
          0,
          "Multiplication by zero collapses the length to zero.",
        );
      } else if (isConst(expr.left, 1)) {
        hint(
          hints,
          "multiply-one",
          expr,
          expr.right,
          "Multiplication by one can reuse the same length.",
        );
      } else if (isConst(expr.right, 1)) {
        hint(
          hints,
          "multiply-one",
          expr,
          expr.left,
          "Multiplication by one can reuse the same length.",
        );
      }
      break;
    case "div":
      visit(expr.left, hints);
      visit(expr.right, hints);
      if (isConst(expr.right, 1)) {
        hint(
          hints,
          "divide-one",
          expr,
          expr.left,
          "Division by one can reuse the numerator length.",
        );
      }
      break;
    case "pow":
      visit(expr.base, hints);
      break;
    case "sqrt":
      visit(expr.value, hints);
      break;
    case "const":
    case "var":
      break;
  }

  const folded = foldConstant(expr);
  if (folded !== undefined && expr.kind !== "const") {
    hint(
      hints,
      "constant-fold",
      expr,
      folded,
      "All-constant subexpressions can be evaluated before folding.",
    );
  }
};

const foldConstant = (expr: Expr): number | undefined => {
  switch (expr.kind) {
    case "const":
      return expr.value;
    case "add": {
      const left = constantValue(expr.left);
      const right = constantValue(expr.right);
      return left !== undefined && right !== undefined
        ? left + right
        : undefined;
    }
    case "sub": {
      const left = constantValue(expr.left);
      const right = constantValue(expr.right);
      return left !== undefined && right !== undefined
        ? left - right
        : undefined;
    }
    case "mul": {
      const left = constantValue(expr.left);
      const right = constantValue(expr.right);
      return left !== undefined && right !== undefined
        ? left * right
        : undefined;
    }
    case "div": {
      const left = constantValue(expr.left);
      const right = constantValue(expr.right);
      return left !== undefined && right !== undefined && right !== 0
        ? left / right
        : undefined;
    }
    case "pow": {
      const base = constantValue(expr.base);
      return base !== undefined ? base ** expr.exponent : undefined;
    }
    case "sqrt": {
      const value = constantValue(expr.value);
      return value !== undefined && value >= 0 ? Math.sqrt(value) : undefined;
    }
    case "var":
      return undefined;
  }
};

export function origamiFunctionSimplificationHints(
  ast: Expr,
): OrigamiFunctionSimplificationHint[] {
  const hints: OrigamiFunctionSimplificationHint[] = [];
  visit(ast, hints);
  return hints;
}
