import { performance } from "node:perf_hooks";
import { parseExpression } from "../../parser/parseExpression";
import { planOrigamiExpression } from "./planExpression";

const references = [
  ["a+b", { a: 2, b: 3 }],
  ["a*b", { a: 2, b: 3 }],
  ["1/a", { a: 2 }],
  ["sqrt(a)", { a: 2 }],
  ["cbrt(2)", {}],
  ["cbrt(a)+sqrt(b)", { a: 8, b: 9 }],
  ["cubic(1,0,0,-2,0)", {}],
  ["cubic(1,-6,11,-6,2)", {}],
  ["cubic(1,-3,3,-1,0)", {}],
] as const;

describe("origami compute release parity", () => {
  it.each(references)(
    "keeps exact branch geometry in every render document for %s",
    (source, values) => {
      const plan = planOrigamiExpression(parseExpression(source), values);
      for (const template of plan.templates) {
        for (const fold of template.folds) {
          const sessionStep = plan.session.steps.find(
            ({ provenance }) => provenance?.templateId === template.id,
          )!;
          expect(sessionStep.example.crease).toEqual(fold.candidate.crease);
          expect(
            sessionStep.document.revealActions.some(
              ({ animation }) => animation === "fold",
            ),
          ).toBe(true);
          expect(
            sessionStep.provenance?.candidates[fold.selectedCandidate].selected,
          ).toBe(true);
        }
      }
    },
  );

  it("compiles the complete reference suite inside the interactive budget", () => {
    const started = performance.now();
    for (const [source, values] of references)
      planOrigamiExpression(parseExpression(source), values);
    const elapsed = performance.now() - started;
    expect(elapsed).toBeLessThan(750);
  });

  it("has stable golden exact identities for radical and cubic cases", () => {
    const signatures = ["sqrt(2)", "cbrt(2)", "cubic(1,-6,11,-6,1)"].map(
      (source) => {
        const plan = planOrigamiExpression(parseExpression(source));
        return {
          expression: source,
          polynomial: plan.analysis.value!.polynomial.map(String),
          selectedRoot: plan.templates.at(-1)!.folds[0].candidate.rootParameter,
        };
      },
    );
    expect(signatures[0].polynomial).toEqual(["-2", "0", "1"]);
    expect(signatures[1].polynomial).toEqual(["-2", "0", "0", "1"]);
    expect(signatures[2].selectedRoot).toBeCloseTo(2);
  });
});
