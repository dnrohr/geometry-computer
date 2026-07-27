import { parseOrigamiExpression } from "./parserBoundary";
import { origamiFunctionSimplificationHints } from "./functionSimplification";

const hintsFor = (source: string) =>
  origamiFunctionSimplificationHints(parseOrigamiExpression(source).ast);

describe("origamiFunctionSimplificationHints", () => {
  it("finds identity simplification opportunities without rewriting the AST", () => {
    expect(hintsFor("f(a)=1*a+0")).toEqual([
      expect.objectContaining({
        expression: "1 * a",
        reason: "multiply-one",
        replacement: "a",
      }),
      expect.objectContaining({
        expression: "1 * a + 0",
        reason: "add-zero",
        replacement: "1 * a",
      }),
    ]);
  });

  it("summarizes zero, division, and direct constant folding hints", () => {
    expect(hintsFor("f(a)=0*a + sqrt(4) + a/1")).toEqual([
      expect.objectContaining({
        expression: "0 * a",
        reason: "multiply-zero",
        replacement: "0",
      }),
      expect.objectContaining({
        expression: "sqrt(4)",
        reason: "constant-fold",
        replacement: "2",
      }),
      expect.objectContaining({
        expression: "a / 1",
        reason: "divide-one",
        replacement: "a",
      }),
    ]);
  });

  it("returns no hints for already direct expressions", () => {
    expect(hintsFor("f(a)=sqrt(a+1)")).toEqual([]);
  });
});
