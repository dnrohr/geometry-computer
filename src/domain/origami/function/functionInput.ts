import { formatExpression } from "../../expression/format";
import { parseExpression } from "../../parser/parseExpression";
import { validateOrigamiAllowableField } from "./allowableField";
import type { OrigamiFunctionPanelState } from "./types";

export const DEFAULT_ORIGAMI_FUNCTION_VALUES: Record<string, number> = {
  a: 3,
  b: 2,
  x: 3,
  y: 2,
};

export function evaluateOrigamiFunctionInput(
  source: string,
  values: Record<string, number> = DEFAULT_ORIGAMI_FUNCTION_VALUES,
): OrigamiFunctionPanelState {
  try {
    const ast = parseExpression(source);
    const report = validateOrigamiAllowableField(ast, values);
    const validation = {
      source: {
        source: formatExpression(ast),
        ast,
        variables: report.variables,
      },
      values,
      value: report.value,
      issues: report.issues,
    };
    return report.allowed
      ? { status: "valid", validation }
      : { status: "blocked", validation };
  } catch (error) {
    return {
      status: "parse-error",
      failure: {
        source,
        error: error instanceof Error ? error.message : "Invalid expression.",
      },
    };
  }
}
