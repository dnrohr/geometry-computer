import { formatExpression } from "../../expression/format";
import type { Expr } from "../../expression/types";
import { parseExpression } from "../../parser/parseExpression";

export type OrigamiParsedExpression = {
  ast: Expr;
  normalizedSource: string;
};

export function parseOrigamiExpression(
  source: string,
): OrigamiParsedExpression {
  const ast = parseExpression(source);
  return {
    ast,
    normalizedSource: formatExpression(ast),
  };
}
