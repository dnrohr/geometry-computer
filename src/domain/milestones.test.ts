import { compileExpression } from "./compiler/compileExpression";
import { constructionExport } from "./export/exportConstruction";
import { parseExpression } from "./parser/parseExpression";
import { arithmeticProofs } from "./proofs/arithmeticProofs";
import { evaluateReveal } from "./reveal/evaluateReveal";

describe("milestone domain behavior", () => {
  it.each([
    ["a+b", 5],
    ["a-b", 1],
    ["a*b", 6],
    ["a/b", 1.5],
    ["a^2", 9],
    ["sqrt(a)", Math.sqrt(3)],
    ["(3*a+b)*(a+b)", 55],
  ])("compiles %s", (source, expected) =>
    expect(
      compileExpression(parseExpression(source), { a: 3, b: 2 }).value,
    ).toBeCloseTo(expected),
  );
  it("rejects malformed and invalid operations", () => {
    expect(() => parseExpression("a + )")).toThrow(/expected/i);
    expect(() => compileExpression(parseExpression("a/0"), { a: 1 })).toThrow(
      /division by zero/i,
    );
    expect(() =>
      compileExpression(parseExpression("sqrt(a)"), { a: -1 }),
    ).toThrow(/negative/i);
  });
  it("creates proof-linked geometry and stable export", () => {
    const scene = compileExpression(parseExpression("a*b"), { a: 2, b: 4 });
    expect(
      scene.objects.some(
        ({ represents }) => represents === "similar triangle baseline",
      ),
    ).toBe(true);
    expect(scene.steps.at(-1)?.proofId).toBe("proof-mul");
    expect(constructionExport(scene)).not.toHaveProperty("selectedObjectId");
  });
  it("evaluates partial reveal and proof assumptions", () => {
    const state = evaluateReveal(
      [
        {
          id: "r",
          stepId: "s",
          objectId: "o",
          start: 0.2,
          end: 0.6,
          animation: "draw",
        },
      ],
      0.4,
    );
    expect(state.o.drawProgress).toBeCloseTo(0.5);
    expect(arithmeticProofs.div.assumptions).toContain("y ≠ 0");
    expect(arithmeticProofs.sqrt.assumptions).toContain("x ≥ 0");
    expect(arithmeticProofs.mul.claims[0].mathLatex).toContain("z/y");
  });
});
