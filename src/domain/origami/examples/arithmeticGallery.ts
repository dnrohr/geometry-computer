import { parseExpression } from "../../parser/parseExpression";
import type { OrigamiArithmeticMacroKind } from "../types";
import { compileOrigamiExpression } from "../compiler/compileOrigamiExpression";

export type OrigamiArithmeticExample = {
  title: string;
  expression: string;
  values: Record<string, number>;
};

export type OrigamiAdvancedArithmeticFixture = OrigamiArithmeticExample & {
  operation: Extract<
    OrigamiArithmeticMacroKind,
    "mul" | "div" | "square" | "sqrt"
  >;
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

export const advancedOrigamiArithmeticFixtures: OrigamiAdvancedArithmeticFixture[] =
  [
    {
      title: "Multiplication geometry fixture",
      expression: "a*b",
      values: { a: 3, b: 2 },
      operation: "mul",
    },
    {
      title: "Division geometry fixture",
      expression: "a/b",
      values: { a: 6, b: 2 },
      operation: "div",
    },
    {
      title: "Square geometry fixture",
      expression: "a^2",
      values: { a: 3 },
      operation: "square",
    },
    {
      title: "Square-root geometry fixture",
      expression: "sqrt(a)",
      values: { a: 4 },
      operation: "sqrt",
    },
  ];

export const compiledAdvancedOrigamiArithmeticFixtures = () =>
  advancedOrigamiArithmeticFixtures.map((fixture) => ({
    ...fixture,
    scene: compileOrigamiExpression(
      parseExpression(fixture.expression),
      fixture.values,
      fixture.expression,
    ),
  }));
