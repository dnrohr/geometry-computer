import { evaluateOrigamiFunctionInput } from "./functionInput";
import { createOrigamiFunctionPlan } from "./functionPlan";
import { verifyOrigamiFunctionPlan } from "./functionPlanVerification";
import type { OrigamiFunctionPlan } from "./types";

const planFor = (source: string) => {
  const state = evaluateOrigamiFunctionInput(source, { a: 2, b: 3 });
  if (state.status !== "valid") {
    throw new Error(`Expected ${source} to be valid.`);
  }
  return createOrigamiFunctionPlan(state);
};

const clonePlan = (plan: OrigamiFunctionPlan): OrigamiFunctionPlan =>
  structuredClone(plan);

describe("verifyOrigamiFunctionPlan", () => {
  it("verifies generated origami function plans", () => {
    const verification = verifyOrigamiFunctionPlan(
      planFor("f(a,b)=(a+b)*(a+b)"),
    );
    expect(verification).toMatchObject({
      status: "verified",
      issueCount: 0,
      checkedTransferCount: 1,
    });
    expect(verification.summary).toMatch(
      /^Verified \d+ nodes, \d+ operations, \d+ phases, and 1 length transfer\.$/,
    );
  });

  it("reports missing node and phase references", () => {
    const plan = clonePlan(planFor("f(a)=a+a"));
    plan.operations[0] = {
      ...plan.operations[0],
      nodeId: "missing-node",
      phaseIds: ["missing-phase"],
    };
    const verification = verifyOrigamiFunctionPlan(plan);
    expect(verification.status).toBe("has-issues");
    expect(verification.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "MISSING_NODE",
          referenceId: "missing-node",
        }),
        expect.objectContaining({
          code: "MISSING_PHASE",
          referenceId: "missing-phase",
        }),
      ]),
    );
  });

  it("reports reuse transfers that lost their reuse operation", () => {
    const plan = clonePlan(planFor("f(a)=a+a"));
    plan.operations = plan.operations.filter(
      ({ kind }) => kind !== "reuse-length",
    );
    expect(verifyOrigamiFunctionPlan(plan).issues).toContainEqual(
      expect.objectContaining({
        code: "MISSING_OPERATION",
        referenceId: "origami-function-transfer-1",
      }),
    );
  });

  it("reports duplicate IDs", () => {
    const plan = clonePlan(planFor("f(a)=sqrt(a+1)"));
    plan.phases[1] = { ...plan.phases[1], id: plan.phases[0].id };
    expect(verifyOrigamiFunctionPlan(plan).issues).toContainEqual(
      expect.objectContaining({
        code: "DUPLICATE_ID",
        referenceId: "origami-function-phase-1",
      }),
    );
  });
});
