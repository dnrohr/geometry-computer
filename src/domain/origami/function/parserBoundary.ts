import { formatExpression } from "../../expression/format";
import type { Expr } from "../../expression/types";
import { parseExpression } from "../../parser/parseExpression";

export type OrigamiParsedExpression = {
  ast: Expr;
  expressionSource: string;
  functionName: string;
  normalizedSource: string;
  signatureVariables?: string[];
  variables: string[];
};

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
      collectVariables(expr.base, variables);
      break;
    case "sqrt":
      collectVariables(expr.value, variables);
      break;
    case "const":
      break;
  }
  return [...variables].sort();
};

const parseSignature = (source: string) => {
  const equalsIndex = source.indexOf("=");
  if (equalsIndex === -1) {
    return {
      expressionSource: source,
      functionName: "f",
      signatureVariables: undefined,
    };
  }
  if (source.indexOf("=", equalsIndex + 1) !== -1) {
    throw new Error(
      "Origami function signatures may contain only one equals sign.",
    );
  }
  const rawSignature = source.slice(0, equalsIndex).trim();
  const expressionSource = source.slice(equalsIndex + 1).trim();
  const match = /^([A-Za-z]+)\s*\(([^)]*)\)$/.exec(rawSignature);
  if (!match) {
    throw new Error("Use a function signature like f(a,b)=a*b.");
  }
  const functionName = match[1];
  const signatureVariables =
    match[2].trim() === ""
      ? []
      : match[2].split(",").map((variable) => variable.trim());
  if (signatureVariables.some((variable) => !/^[A-Za-z]+$/.test(variable))) {
    throw new Error("Function signature variables must be alphabetic names.");
  }
  if (new Set(signatureVariables).size !== signatureVariables.length) {
    throw new Error("Function signature variables must be unique.");
  }
  if (!expressionSource) {
    throw new Error("Enter an expression after the function signature.");
  }
  return { expressionSource, functionName, signatureVariables };
};

export function parseOrigamiExpression(
  source: string,
): OrigamiParsedExpression {
  const signature = parseSignature(source);
  const ast = parseExpression(signature.expressionSource);
  const inferredVariables = collectVariables(ast);
  if (
    signature.signatureVariables &&
    (signature.signatureVariables.some(
      (variable) => !inferredVariables.includes(variable),
    ) ||
      inferredVariables.some(
        (variable) => !signature.signatureVariables?.includes(variable),
      ))
  ) {
    throw new Error(
      "Function signature variables must match the expression variables.",
    );
  }
  const variables = signature.signatureVariables ?? inferredVariables;
  return {
    ast,
    expressionSource: formatExpression(ast),
    functionName: signature.functionName,
    normalizedSource: `${signature.functionName}(${variables.join(", ")}) = ${formatExpression(ast)}`,
    signatureVariables: signature.signatureVariables,
    variables,
  };
}
