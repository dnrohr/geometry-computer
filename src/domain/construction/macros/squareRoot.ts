import { ConstructionError } from "../ConstructionContext";
export function squareRoot(value: number) {
  if (value < 0)
    throw new ConstructionError(
      "A negative length has no real square root construction.",
      "NEGATIVE_SQUARE_ROOT",
    );
  return {
    operation: "sqrt" as const,
    value: Math.sqrt(value),
    method: "semicircle geometric mean",
    events: ["semicircle", "perpendicular", "intersection", "positive-branch"],
  };
}
