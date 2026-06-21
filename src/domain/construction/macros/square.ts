import { multiplication, generateSimilarTriangles } from "./multiplication";
import type { MacroRequest } from "./macroTypes";

export const square = (value: number) => ({
  ...multiplication(value, value),
  operation: "square" as const,
  proofId: "proof-square",
});

export function generateSquare(request: MacroRequest) {
  return generateSimilarTriangles(
    { ...request, inputs: [request.inputs[0], request.inputs[0]] },
    "square",
  );
}
