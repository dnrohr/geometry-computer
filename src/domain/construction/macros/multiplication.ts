export const multiplication = (left: number, right: number) => ({
  operation: "mul" as const,
  value: left * right,
  method: "similar-triangle scaling",
  events: ["parallel", "intersection", "result-extraction"],
});
