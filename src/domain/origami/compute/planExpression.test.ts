import { parseExpression } from "../../parser/parseExpression";
import { planOrigamiExpression, OrigamiPlanningError } from "./planExpression";
import { parseOrigamiSession, serializeOrigamiSession } from "../session";

describe("planOrigamiExpression", () => {
  it("compiles a mixed expression into dependency-ordered folds", () => {
    const plan = planOrigamiExpression(parseExpression("cbrt(a)+sqrt(b)"), {
      a: 8,
      b: 9,
    });
    expect(plan.analysis.value?.approximation).toBeCloseTo(5);
    expect(plan.templates.map(({ operation }) => operation)).toEqual([
      "cube-root",
      "square-root",
      "add",
    ]);
    expect(plan.session.steps).toHaveLength(3);
    expect(plan.nodes.at(-1)?.dependencyIds).toHaveLength(2);
  });

  it("reuses common subexpressions", () => {
    const plan = planOrigamiExpression(parseExpression("cbrt(a)+cbrt(a)"), {
      a: 8,
    });
    expect(
      plan.templates.filter(({ operation }) => operation === "cube-root"),
    ).toHaveLength(1);
    expect(plan.session.steps).toHaveLength(2);
  });

  it("is byte-for-byte deterministic for identical inputs", () => {
    const ast = parseExpression("cubic(1,-6,11,-6,2)");
    const first = planOrigamiExpression(ast);
    const second = planOrigamiExpression(ast);
    const stringify = (value: unknown) =>
      JSON.stringify(value, (_, item) =>
        typeof item === "bigint" ? item.toString() : item,
      );
    expect(stringify(first)).toBe(stringify(second));
    expect(
      first.templates.find(({ operation }) => operation === "cubic-root")!
        .folds[0].rejectedCandidates,
    ).toHaveLength(2);
  });

  it("fails before creating a session for an invalid expression", () => {
    expect(() =>
      planOrigamiExpression(parseExpression("1/a"), { a: 0 }),
    ).toThrow(OrigamiPlanningError);
  });

  it("reports the current planner power limit", () => {
    expect(() =>
      planOrigamiExpression(parseExpression("a^3"), { a: 2 }),
    ).toThrow(/powers 0 and 2/i);
  });

  it("retains exact proof and branch provenance in exported sessions", () => {
    const plan = planOrigamiExpression(parseExpression("cbrt(2)"));
    const restored = parseOrigamiSession(serializeOrigamiSession(plan.session));
    const provenance = restored.steps[0].provenance!;
    expect(provenance.polynomial).toEqual(["-2", "0", "0", "1"]);
    expect(provenance.proofClaims).toHaveLength(2);
    expect(provenance.candidates.some(({ selected }) => selected)).toBe(true);
    expect(provenance.sessionStepId).toBe("session-fold-1");
    expect(provenance.creaseObjectIds.length).toBeGreaterThan(0);
    expect(provenance.physicalInstruction).toMatch(/unfold/i);
  });
});
