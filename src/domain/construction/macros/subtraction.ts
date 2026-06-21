export const subtraction = (left: number, right: number) => ({
  operation: "sub" as const,
  value: left - right,
  directed: left - right < 0,
  method: "opposite directed transfer",
});
