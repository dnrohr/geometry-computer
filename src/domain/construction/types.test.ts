import { polynomialConstructionTrace } from "./examples";

describe("construction trace model", () => {
  it("uses unique IDs in every trace collection", () => {
    for (const collection of [
      polynomialConstructionTrace.nodes,
      polynomialConstructionTrace.steps,
      polynomialConstructionTrace.proofs,
      polynomialConstructionTrace.revealActions,
    ]) {
      const ids = collection.map(({ id }) => id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("connects every step output to a known construction output", () => {
    const outputs = new Set(
      polynomialConstructionTrace.nodes.map(({ output }) => output),
    );
    for (const step of polynomialConstructionTrace.steps) {
      for (const output of step.outputObjectIds)
        expect(outputs.has(output)).toBe(true);
    }
  });

  it("resolves proof and reveal references", () => {
    const proofIds = new Set(
      polynomialConstructionTrace.proofs.map(({ id }) => id),
    );
    const stepIds = new Set(
      polynomialConstructionTrace.steps.map(({ id }) => id),
    );
    for (const step of polynomialConstructionTrace.steps) {
      if (step.proofId) expect(proofIds.has(step.proofId)).toBe(true);
    }
    for (const action of polynomialConstructionTrace.revealActions)
      expect(stepIds.has(action.stepId)).toBe(true);
  });
});
