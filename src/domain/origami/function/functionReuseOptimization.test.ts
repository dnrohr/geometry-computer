import { evaluateOrigamiFunctionInput } from "./functionInput";
import { createOrigamiFunctionPlan } from "./functionPlan";
import { origamiFunctionReuseOptimizationSummary } from "./functionReuseOptimization";

const planFor = (source: string) => {
  const state = evaluateOrigamiFunctionInput(source, { a: 2, b: 3 });
  if (state.status !== "valid") {
    throw new Error(`Expected ${source} to be valid.`);
  }
  return createOrigamiFunctionPlan(state);
};

describe("origamiFunctionReuseOptimizationSummary", () => {
  it("summarizes repeated variable length transfers", () => {
    const summary = origamiFunctionReuseOptimizationSummary(
      planFor("f(a)=a+a"),
    );
    expect(summary).toMatchObject({
      transferCount: 1,
      reusedExpressionCount: 1,
      avoidedPhaseCount: 1,
      summary:
        "1 transfer reuse 1 expression and avoid 1 duplicate source phase.",
    });
    expect(summary.items).toEqual([
      expect.objectContaining({
        expression: "a",
        sourceNodeKind: "input",
        avoidedPhaseCount: 1,
        summary: "Reusing a avoids replaying 1 source phase.",
      }),
    ]);
  });

  it("counts repeated composite subexpression phases", () => {
    const summary = origamiFunctionReuseOptimizationSummary(
      planFor("f(a,b)=(a+b)*(a+b)"),
    );
    expect(summary).toMatchObject({
      transferCount: 1,
      reusedExpressionCount: 1,
      avoidedPhaseCount: 5,
    });
    expect(summary.items[0]).toMatchObject({
      expression: "a + b",
      sourceNodeKind: "add",
      summary: "Reusing a + b avoids replaying 5 source phases.",
    });
  });

  it("returns an empty summary when no subexpression is reused", () => {
    expect(
      origamiFunctionReuseOptimizationSummary(planFor("f(a)=sqrt(a+1)")),
    ).toMatchObject({
      transferCount: 0,
      reusedExpressionCount: 0,
      avoidedPhaseCount: 0,
      items: [],
      summary: "No repeated subexpression lengths are currently reusable.",
    });
  });
});
