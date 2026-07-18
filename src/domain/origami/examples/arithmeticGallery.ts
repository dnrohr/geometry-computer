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
