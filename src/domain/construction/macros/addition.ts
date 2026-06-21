export const addition = (left: number, right: number) => ({
  operation: "add" as const,
  value: left + right,
  directed: false,
  method: "consecutive segment transfer",
});
