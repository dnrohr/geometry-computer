import { formatExpression } from "../../expression/format";
import type { Expr } from "../../expression/types";

export type OrigamiFunctionSimplificationHint = {
  id: string;
  expression: string;
  replacement: string;
  reason:
    | "add-zero"
    | "combine-add-constants"
    | "combine-multiply-constants"
    | "subtract-zero"
    | "subtract-self"
    | "multiply-one"
    | "multiply-zero"
    | "divide-one"
    | "power-one"
    | "constant-fold";
  summary: string;
};

const isConst = (expr: Expr, value: number) =>
  expr.kind === "const" && expr.value === value;

const constantValue = (expr: Expr): number | undefined =>
  expr.kind === "const" ? expr.value : undefined;

const exprKey = (expr: Expr) => formatExpression(expr);

const formatReplacement = (replacement: Expr | number | string) =>
  typeof replacement === "string"
    ? replacement
    : typeof replacement === "number"
      ? String(replacement)
      : formatExpression(replacement);

const combineWithOperator = (
  expr: Expr,
  operator: "+" | "*",
  value: number,
) => {
  if (operator === "+" && value === 0) return formatExpression(expr);
  if (operator === "+" && value < 0) {
    return `${formatExpression(expr)} - ${Math.abs(value)}`;
  }
  if (operator === "*" && value === 1) return formatExpression(expr);
  return `${formatExpression(expr)} ${operator} ${value}`;
};

const hint = (
  hints: OrigamiFunctionSimplificationHint[],
  reason: OrigamiFunctionSimplificationHint["reason"],
  expr: Expr,
  replacement: Expr | number | string,
  summary: string,
) => {
  hints.push({
    id: `origami-function-simplification-${hints.length + 1}`,
    expression: formatExpression(expr),
    replacement: formatReplacement(replacement),
    reason,
    summary,
  });
};

const maybeHintCombinedAdditionConstants = (
  expr: Extract<Expr, { kind: "add" }>,
  hints: OrigamiFunctionSimplificationHint[],
) => {
  const right = constantValue(expr.right);
  if (right === undefined) return;
  if (expr.left.kind === "add") {
    const nestedRight = constantValue(expr.left.right);
    if (nestedRight !== undefined) {
      hint(
        hints,
        "combine-add-constants",
        expr,
        combineWithOperator(expr.left.left, "+", nestedRight + right),
        "Adjacent constant offsets can be combined before planning folds.",
      );
      return;
    }
    const nestedLeft = constantValue(expr.left.left);
    if (nestedLeft !== undefined) {
      hint(
        hints,
        "combine-add-constants",
        expr,
        combineWithOperator(expr.left.right, "+", nestedLeft + right),
        "Adjacent constant offsets can be combined before planning folds.",
      );
    }
  } else if (expr.left.kind === "sub") {
    const nestedRight = constantValue(expr.left.right);
    if (nestedRight !== undefined) {
      hint(
        hints,
        "combine-add-constants",
        expr,
        combineWithOperator(expr.left.left, "+", right - nestedRight),
        "Constant offsets across nearby addition and subtraction can be combined.",
      );
    }
  }
};

const maybeHintCombinedMultiplicationConstants = (
  expr: Extract<Expr, { kind: "mul" }>,
  hints: OrigamiFunctionSimplificationHint[],
) => {
  const right = constantValue(expr.right);
  if (right === undefined || expr.left.kind !== "mul") return;
  const nestedRight = constantValue(expr.left.right);
  if (nestedRight !== undefined) {
    hint(
      hints,
      "combine-multiply-constants",
      expr,
      combineWithOperator(expr.left.left, "*", nestedRight * right),
      "Adjacent constant scale factors can be combined before planning folds.",
    );
    return;
  }
  const nestedLeft = constantValue(expr.left.left);
  if (nestedLeft !== undefined) {
    hint(
      hints,
      "combine-multiply-constants",
      expr,
      combineWithOperator(expr.left.right, "*", nestedLeft * right),
      "Adjacent constant scale factors can be combined before planning folds.",
    );
  }
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
      } else {
        maybeHintCombinedAdditionConstants(expr, hints);
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
      } else if (exprKey(expr.left) === exprKey(expr.right)) {
        hint(
          hints,
          "subtract-self",
          expr,
          0,
          "Subtracting a length from itself collapses to zero.",
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
      } else {
        maybeHintCombinedMultiplicationConstants(expr, hints);
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
      if (expr.exponent === 1) {
        hint(
          hints,
          "power-one",
          expr,
          expr.base,
          "A first power can reuse the base length.",
        );
      }
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
