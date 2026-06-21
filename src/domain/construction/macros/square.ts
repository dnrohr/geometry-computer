import { multiplication } from "./multiplication";
export const square = (value: number) => ({
  ...multiplication(value, value),
  operation: "square" as const,
  proofId: "proof-square",
});
