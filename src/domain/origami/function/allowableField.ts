import type { Expr } from "../../expression/types";
import { formatExpression } from "../../expression/format";

export type OrigamiAllowableFieldIssueCode =
  | "MISSING_VARIABLE"
  | "DIVISION_BY_ZERO"
  | "NEGATIVE_SQUARE_ROOT"
  | "UNSUPPORTED_POWER"
  | "NONFINITE_VALUE";

export type OrigamiAllowableFieldIssue = {
  code: OrigamiAllowableFieldIssueCode;
  expression: string;
  message: string;
};

export type OrigamiAllowableFieldReport = {
  allowed: boolean;
  variables: string[];
  value?: number;
  issues: OrigamiAllowableFieldIssue[];
};

const issue = (
  code: OrigamiAllowableFieldIssueCode,
  expr: Expr,
  message: string,
): OrigamiAllowableFieldIssue => ({
  code,
  expression: formatExpression(expr),
  message,
});

const collectVariables = (expr: Expr, variables = new Set<string>()) => {
  switch (expr.kind) {
    case "var":
      variables.add(expr.name);
      break;
    case "add":
    case "sub":
    case "mul":
    case "div":
      collectVariables(expr.left, variables);
      collectVariables(expr.right, variables);
      break;
    case "pow":
    case "sqrt":
      collectVariables(expr.kind === "pow" ? expr.base : expr.value, variables);
      break;
    case "const":
      break;
  }
  return [...variables].sort();
};

const evaluate = (
  expr: Expr,
  values: Record<string, number>,
  issues: OrigamiAllowableFieldIssue[],
): number | undefined => {
  switch (expr.kind) {
    case "const":
      if (!Number.isFinite(expr.value)) {
        issues.push(
          issue(
            "NONFINITE_VALUE",
            expr,
            "Origami function constants must be finite real numbers.",
          ),
        );
        return undefined;
      }
      return expr.value;
    case "var": {
      const value = values[expr.name];
      if (value === undefined) {
        issues.push(
          issue(
            "MISSING_VARIABLE",
            expr,
            `Supply a sampled value for ${expr.name}.`,
          ),
        );
        return undefined;
      }
      if (!Number.isFinite(value)) {
        issues.push(
          issue(
            "NONFINITE_VALUE",
            expr,
            `The sampled value for ${expr.name} must be finite.`,
          ),
        );
        return undefined;
      }
      return value;
    }
    case "add": {
      const left = evaluate(expr.left, values, issues);
      const right = evaluate(expr.right, values, issues);
      return left === undefined || right === undefined
        ? undefined
        : left + right;
    }
    case "sub": {
      const left = evaluate(expr.left, values, issues);
      const right = evaluate(expr.right, values, issues);
      return left === undefined || right === undefined
        ? undefined
        : left - right;
    }
    case "mul": {
      const left = evaluate(expr.left, values, issues);
      const right = evaluate(expr.right, values, issues);
      return left === undefined || right === undefined
        ? undefined
        : left * right;
    }
    case "div": {
      const left = evaluate(expr.left, values, issues);
      const right = evaluate(expr.right, values, issues);
      if (right === 0) {
        issues.push(
          issue(
            "DIVISION_BY_ZERO",
            expr.right,
            "Division by zero is outside the sampled origami function domain.",
          ),
        );
        return undefined;
      }
      return left === undefined || right === undefined
        ? undefined
        : left / right;
    }
    case "pow": {
      const base = evaluate(expr.base, values, issues);
      if (!Number.isInteger(expr.exponent) || expr.exponent < 0) {
        issues.push(
          issue(
            "UNSUPPORTED_POWER",
            expr,
            "Origami function powers must be nonnegative integers in the allowable field.",
          ),
        );
        return undefined;
      }
      return base === undefined ? undefined : base ** expr.exponent;
    }
    case "sqrt": {
      const value = evaluate(expr.value, values, issues);
      if (value === undefined) return undefined;
      if (value < 0) {
        issues.push(
          issue(
            "NEGATIVE_SQUARE_ROOT",
            expr.value,
            "Square roots need a nonnegative sampled radicand in the real origami function field.",
          ),
        );
        return undefined;
      }
      return Math.sqrt(value);
    }
  }
};

export const origamiAllowableFieldSummary = [
  "variables",
  "finite rational or decimal constants",
  "addition and subtraction",
  "multiplication and division with nonzero sampled denominators",
  "nonnegative integer powers supported by the parser",
  "square roots with nonnegative sampled radicands",
  "composition of supported expressions",
];

export function validateOrigamiAllowableField(
  expr: Expr,
  values: Record<string, number> = {},
): OrigamiAllowableFieldReport {
  const issues: OrigamiAllowableFieldIssue[] = [];
  const value = evaluate(expr, values, issues);
  return {
    allowed: issues.length === 0,
    variables: collectVariables(expr),
    value,
    issues,
  };
}
