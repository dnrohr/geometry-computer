export type OrigamiFunctionExample = {
  title: string;
  displaySource: string;
  expression: string;
  values: Record<string, number>;
};

export type OrigamiFunctionChallenge = OrigamiFunctionExample & {
  prompt: string;
  expectedFoldCount: number;
};

export const origamiFunctionExamples: OrigamiFunctionExample[] = [
  {
    title: "Product",
    displaySource: "f(a,b)=a*b",
    expression: "a*b",
    values: { a: 3, b: 2 },
  },
  {
    title: "Shifted root",
    displaySource: "f(x)=sqrt(x+1)",
    expression: "sqrt(x+1)",
    values: { x: 3 },
  },
  {
    title: "Offset quotient",
    displaySource: "f(a,b,c)=(a+b)/(c+1)",
    expression: "(a+b)/(c+1)",
    values: { a: 3, b: 2, c: 1 },
  },
];

export const origamiFunctionChallenges: OrigamiFunctionChallenge[] = [
  {
    title: "Make 2a + b",
    prompt: "Double one input, then add a second measured length.",
    displaySource: "f(a,b)=2*a+b",
    expression: "2*a+b",
    values: { a: 2, b: 1.5 },
    expectedFoldCount: 15,
  },
  {
    title: "Scaled reciprocal",
    prompt: "Scale an input by a reciprocal denominator.",
    displaySource: "f(a,b)=a/(b+1)",
    expression: "a/(b+1)",
    values: { a: 3, b: 2 },
    expectedFoldCount: 15,
  },
  {
    title: "Extract sqrt(a+1)",
    prompt: "Shift an input and extract its square root.",
    displaySource: "f(a)=sqrt(a+1)",
    expression: "sqrt(a+1)",
    values: { a: 3 },
    expectedFoldCount: 14,
  },
];
