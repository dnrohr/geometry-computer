import { parseExpression } from "../../parser/parseExpression";
import { compileOrigamiExpression } from "../compiler/compileOrigamiExpression";

export type OrigamiArithmeticExample = {
  title: string;
  expression: string;
  values: Record<string, number>;
};

export const origamiArithmeticExamples: OrigamiArithmeticExample[] = [
  {
    title: "Input length",
    expression: "a",
    values: { a: 3 },
  },
  {
    title: "Constant length",
    expression: "2",
    values: {},
  },
  {
    title: "Addition trace",
    expression: "a+b",
    values: { a: 3, b: 2 },
  },
  {
    title: "Subtraction trace",
    expression: "a-b",
    values: { a: 3, b: 2 },
  },
  {
    title: "Multiplication trace",
    expression: "a*b",
    values: { a: 3, b: 2 },
  },
  {
    title: "Division trace",
    expression: "a/b",
    values: { a: 6, b: 2 },
  },
  {
    title: "Square trace",
    expression: "a^2",
    values: { a: 3 },
  },
  {
    title: "Square root trace",
    expression: "sqrt(a)",
    values: { a: 4 },
  },
];

export const compiledOrigamiArithmeticExamples = () =>
  origamiArithmeticExamples.map((example) => ({
    ...example,
    scene: compileOrigamiExpression(
      parseExpression(example.expression),
      example.values,
      example.expression,
    ),
  }));
