import { compiledAdvancedOrigamiArithmeticFixtures } from "./arithmeticGallery";

describe("advanced origami arithmetic fixtures", () => {
  it("ships deterministic geometry fixtures for advanced arithmetic macros", () => {
    const fixtures = compiledAdvancedOrigamiArithmeticFixtures();

    expect(fixtures.map(({ title, operation }) => [title, operation])).toEqual([
      ["Multiplication geometry fixture", "mul"],
      ["Division geometry fixture", "div"],
      ["Square geometry fixture", "square"],
      ["Square-root geometry fixture", "sqrt"],
    ]);
    expect(fixtures).toEqual(compiledAdvancedOrigamiArithmeticFixtures());
  });

  it("exposes intermediate geometry needed by renderer and inspector consumers", () => {
    for (const {
      operation,
      scene,
    } of compiledAdvancedOrigamiArithmeticFixtures()) {
      const step = scene.steps.find((item) => item.operation === operation);
      const trace = step?.macroTrace;
      const proof = scene.proofs.find(({ id }) => id === step?.proofId);

      expect(trace).toBeDefined();
      expect(trace?.unitReferenceObjectIds.length).toBeGreaterThan(0);
      expect(trace?.guideLineObjectIds.length).toBeGreaterThan(0);
      expect(trace?.foldCreaseObjectIds.length).toBeGreaterThan(1);
      expect(trace?.selectedIntersectionObjectIds.length).toBeGreaterThan(0);
      expect(trace?.resultSegmentObjectIds.length).toBe(1);
      expect(trace?.branchSelections).toEqual([
        expect.objectContaining({ selected: true }),
      ]);
      expect(proof?.claims.map(({ id }) => id)).toEqual(
        expect.arrayContaining(trace?.proofClaimIds ?? []),
      );

      const exposedIds = new Set([
        ...(trace?.unitReferenceObjectIds ?? []),
        ...(trace?.guideLineObjectIds ?? []),
        ...(trace?.foldCreaseObjectIds ?? []),
        ...(trace?.selectedIntersectionObjectIds ?? []),
        ...(trace?.resultSegmentObjectIds ?? []),
      ]);
      for (const objectId of exposedIds) {
        expect(scene.objects.some(({ id }) => id === objectId)).toBe(true);
        expect(step?.createdObjectIds).toContain(objectId);
      }
    }
  });
});
