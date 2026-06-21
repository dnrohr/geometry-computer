export type GalleryExample = {
  name: string;
  expression: string;
  values: Record<string, number>;
  note: string;
  simplified?: string;
};
export const gallery: GalleryExample[] = [
  {
    name: "Addition",
    expression: "a + b",
    values: { a: 3, b: 2 },
    note: "Consecutive segment transfer",
  },
  {
    name: "Subtraction",
    expression: "a - b",
    values: { a: 3, b: 5 },
    note: "Directed length",
  },
  {
    name: "Multiplication",
    expression: "a * b",
    values: { a: 3, b: 2 },
    note: "Similar triangles",
  },
  {
    name: "Division",
    expression: "a / b",
    values: { a: 6, b: 2 },
    note: "Inverse scaling",
  },
  {
    name: "Square",
    expression: "a^2",
    values: { a: 3 },
    note: "Repeated multiplication",
  },
  {
    name: "Square root",
    expression: "sqrt(a)",
    values: { a: 4 },
    note: "Geometric mean",
  },
  {
    name: "Polynomial product",
    expression: "(3*a + b) * (a + b)",
    values: { a: 2, b: 1 },
    note: "Nested construction",
    simplified: "3*a^2 + 4*a*b + b^2",
  },
  {
    name: "Expanded polynomial",
    expression: "3*a^2 + 4*a*b + b^2",
    values: { a: 2, b: 1 },
    note: "The same value in expanded form",
  },
];
