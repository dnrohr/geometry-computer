import { ConstructionError } from "../ConstructionContext";
export function division(left: number, right: number) {
  if (right === 0)
    throw new ConstructionError(
      "Division by zero has no construction.",
      "DIVISION_BY_ZERO",
    );
  return {
    operation: "div" as const,
    value: left / right,
    method: "inverse similar-triangle scaling",
    assumptions: ["denominator != 0"],
  };
}
