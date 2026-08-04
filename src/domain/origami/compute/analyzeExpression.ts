import { formatExpression } from "../../expression/format";
import type { Expr } from "../../expression/types";
import {
  addOrigami,
  algebraicRoot,
  cbrtOrigami,
  divideOrigami,
  multiplyOrigami,
  rationalNumber,
  reciprocalOrigami,
  sqrtOrigami,
  subtractOrigami,
  type OrigamiNumber,
} from "../algebra/origamiNumber";
import { rational, rationalFromDecimal, type Rational } from "../algebra/rational";

export type ConstructibilityClass =
  | "euclidean"
  | "origami-only"
  | "invalid"
  | "unsupported";

export type ExpressionDiagnosticCode =
  | "MISSING_VARIABLE"
  | "DIVISION_BY_ZERO"
  | "NON_REAL_ROOT"
  | "INVALID_CUBIC"
  | "INVALID_ROOT_INDEX"
  | "NON_RATIONAL_COEFFICIENT"
  | "UNSUPPORTED_POWER"
  | "COMPLEXITY_LIMIT";

export type ExpressionDiagnostic = {
  code: ExpressionDiagnosticCode;
  expression: string;
  message: string;
};

export type AlgebraDagNode = {
  id: string;
  expression: string;
  kind: Expr["kind"];
  dependencyIds: string[];
  value?: OrigamiNumber;
};

export type ExpressionAnalysis = {
  classification: ConstructibilityClass;
  reason: string;
  value?: OrigamiNumber;
  rootNodeId?: string;
  nodes: AlgebraDagNode[];
  requiredOperations: Array<"square-root" | "cube-root" | "cubic-root">;
  diagnostic?: ExpressionDiagnostic;
};

class AnalysisFailure extends Error {
  constructor(
    readonly classification: "invalid" | "unsupported",
    readonly diagnostic: ExpressionDiagnostic,
  ) {
    super(diagnostic.message);
  }
}

const children = (expr: Expr): Expr[] => {
  switch (expr.kind) {
    case "const":
    case "var":
      return [];
    case "sqrt":
    case "cbrt":
      return [expr.value];
    case "pow":
      return [expr.base];
    case "cubicRoot":
      return expr.coefficients;
    default:
      return [expr.left, expr.right];
  }
};

const rationalValue = (value: OrigamiNumber): Rational | undefined => {
  if (value.polynomial.length !== 2) return undefined;
  return rational(-value.polynomial[0], value.polynomial[1]);
};

const power = (base: OrigamiNumber, exponent: number): OrigamiNumber => {
  if (!Number.isInteger(exponent)) throw new Error("Exponent must be an integer.");
  if (exponent < 0) return reciprocalOrigami(power(base, -exponent));
  let result = rationalNumber(1);
  let factor = base;
  let remaining = exponent;
  while (remaining > 0) {
    if (remaining % 2 === 1) result = multiplyOrigami(result, factor);
    remaining = Math.floor(remaining / 2);
    if (remaining) factor = multiplyOrigami(factor, factor);
  }
  return result;
};

export function analyzeOrigamiExpression(
  expression: Expr,
  variables: Record<string, number> = {},
): ExpressionAnalysis {
  const nodes: AlgebraDagNode[] = [];
  const nodeIds = new Map<string, string>();
  const values = new Map<string, OrigamiNumber>();
  const required = new Set<"square-root" | "cube-root" | "cubic-root">();

  const fail = (
    classification: "invalid" | "unsupported",
    code: ExpressionDiagnosticCode,
    expr: Expr,
    message: string,
  ): never => {
    throw new AnalysisFailure(classification, {
      code,
      expression: formatExpression(expr),
      message,
    });
  };

  const evaluate = (expr: Expr): OrigamiNumber => {
    const key = formatExpression(expr);
    const cached = values.get(key);
    if (cached) return cached;
    const dependencyIds = children(expr).map((child) => {
      evaluate(child);
      return nodeIds.get(formatExpression(child))!;
    });
    const id = `expr-${nodes.length + 1}`;
    nodeIds.set(key, id);
    const node: AlgebraDagNode = { id, expression: key, kind: expr.kind, dependencyIds };
    nodes.push(node);
    let value: OrigamiNumber;
    try {
      switch (expr.kind) {
        case "const":
          value = rationalNumber(rationalFromDecimal(expr.value));
          break;
        case "var": {
          const supplied = variables[expr.name];
          if (supplied === undefined)
            return fail(
              "invalid",
              "MISSING_VARIABLE",
              expr,
              `Supply a value for ${expr.name}.`,
            );
          value = rationalNumber(rationalFromDecimal(supplied));
          break;
        }
        case "add":
          value = addOrigami(evaluate(expr.left), evaluate(expr.right));
          break;
        case "sub":
          value = subtractOrigami(evaluate(expr.left), evaluate(expr.right));
          break;
        case "mul":
          value = multiplyOrigami(evaluate(expr.left), evaluate(expr.right));
          break;
        case "div": {
          const divisor = evaluate(expr.right);
          if (divisor.polynomial.length === 2 && divisor.polynomial[0] === 0n)
            return fail(
              "invalid",
              "DIVISION_BY_ZERO",
              expr,
              "Division by zero is undefined and cannot be constructed.",
            );
          value = divideOrigami(evaluate(expr.left), divisor);
          break;
        }
        case "pow":
          if (!Number.isInteger(expr.exponent))
            return fail(
              "unsupported",
              "UNSUPPORTED_POWER",
              expr,
              "Only integer powers are supported.",
            );
          value = power(evaluate(expr.base), expr.exponent);
          break;
        case "sqrt":
          required.add("square-root");
          if (evaluate(expr.value).approximation < 0)
            return fail(
              "invalid",
              "NON_REAL_ROOT",
              expr,
              "This square root has no real value.",
            );
          value = sqrtOrigami(evaluate(expr.value));
          break;
        case "cbrt":
          required.add("cube-root");
          value = cbrtOrigami(evaluate(expr.value));
          break;
        case "cubicRoot": {
          required.add("cubic-root");
          const coefficients = expr.coefficients.map((coefficient) => {
            const rational = rationalValue(evaluate(coefficient));
            if (!rational)
              return fail(
                "unsupported",
                "NON_RATIONAL_COEFFICIENT",
                coefficient,
                "Cubic coefficients must currently evaluate to rational numbers.",
              );
            return rational;
          });
          if (coefficients[0].numerator === 0n)
            return fail(
              "invalid",
              "INVALID_CUBIC",
              expr,
              "The leading cubic coefficient must be nonzero.",
            );
          const commonDenominator = coefficients.reduce(
            (product, coefficient) => product * coefficient.denominator,
            1n,
          );
          const polynomial = [...coefficients]
            .reverse()
            .map(
              (coefficient) =>
                coefficient.numerator *
                (commonDenominator / coefficient.denominator),
            );
          try {
            value = algebraicRoot(polynomial, expr.rootIndex);
          } catch (error) {
            return fail(
              "invalid",
              "INVALID_ROOT_INDEX",
              expr,
              error instanceof Error
                ? error.message
                : "The selected real cubic root does not exist.",
            );
          }
          break;
        }
      }
    } catch (error) {
      if (error instanceof AnalysisFailure) throw error;
      return fail(
        "unsupported",
        "COMPLEXITY_LIMIT",
        expr,
        error instanceof Error ? error.message : "Expression evaluation failed.",
      );
    }
    values.set(key, value);
    node.value = value;
    return value;
  };

  try {
    const value = evaluate(expression);
    const origamiOnly = required.has("cube-root") || required.has("cubic-root");
    return {
      classification: origamiOnly ? "origami-only" : "euclidean",
      reason: origamiOnly
        ? "The expression requires a cube-root or cubic-root fold available to origami."
        : "The expression uses only rational field operations and square roots.",
      value,
      rootNodeId: nodeIds.get(formatExpression(expression)),
      nodes,
      requiredOperations: [...required],
    };
  } catch (error) {
    if (!(error instanceof AnalysisFailure)) throw error;
    return {
      classification: error.classification,
      reason: error.diagnostic.message,
      nodes,
      requiredOperations: [...required],
      diagnostic: error.diagnostic,
    };
  }
}
