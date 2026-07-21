import { existsSync } from "node:fs";
import {
  compatibilityGateFor,
  mergerCompatibilityGates,
  type SharedInterfaceCandidate,
} from "./mergerCompatibility";

describe("merger compatibility gates", () => {
  it("blocks every proposed shared interface until paired tests exist", () => {
    const candidates: SharedInterfaceCandidate[] = [
      "function-plan",
      "proof-card",
      "export",
      "expression-control",
    ];

    expect(mergerCompatibilityGates.map(({ candidate }) => candidate)).toEqual(
      candidates,
    );
    for (const candidate of candidates) {
      const gate = compatibilityGateFor(candidate);
      expect(gate).toMatchObject({
        candidate,
        status: "blocked-until-tested",
      });
      expect(gate?.compassEvidence).toMatch(/Compass/);
      expect(gate?.origamiEvidence).toMatch(/Origami/);
      expect(gate?.requiredCompatibilityTest).toMatch(/test/i);
    }
  });

  it("does not extract shared interface modules before F8.3 gates are satisfied", () => {
    for (const forbiddenPath of [
      "src/domain/sharedFunctionPlan.ts",
      "src/domain/sharedProofCard.ts",
      "src/domain/sharedExport.ts",
      "src/domain/sharedExpressionControl.ts",
      "src/domain/shared/functionPlan.ts",
      "src/domain/shared/proofCard.ts",
      "src/domain/shared/export.ts",
      "src/domain/shared/expressionControl.ts",
    ]) {
      expect(existsSync(forbiddenPath)).toBe(false);
    }
  });
});
