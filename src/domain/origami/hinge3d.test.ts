import { compileOrigamiExample, origamiExamples } from "./examples";
import { evaluateHingeObject } from "./hinge3d";

describe("3D hinge evaluation", () => {
  const document = compileOrigamiExample(origamiExamples[0]);
  const fold = document.revealActions.find(
    ({ animation }) => animation === "fold",
  )!;
  const object = document.objects.find(({ id }) => id === fold.objectId)!;

  it("starts at the canonical source and settles exactly on the flat target", () => {
    if (object.data.kind !== "polygon" || !("targetPoints" in fold))
      throw new Error("expected fold polygon");
    expect(
      evaluateHingeObject(document, object.id, fold.start)?.points.map(
        ({ x, y }) => ({ x, y }),
      ),
    ).toEqual(object.data.points);
    expect(
      evaluateHingeObject(document, object.id, fold.end)?.points.map(
        ({ x, y }) => ({ x, y }),
      ),
    ).toEqual(fold.targetPoints);
  });

  it("lifts moving vertices out of plane at the midpoint while the crease stays fixed", () => {
    const midpoint = evaluateHingeObject(
      document,
      object.id,
      (fold.start + fold.end) / 2,
    )!;
    expect(midpoint.points.some(({ z }) => Math.abs(z) > 0.1)).toBe(true);
    const crease = document.objects.find(({ kind }) => kind === "crease")!;
    if (crease.data.kind !== "crease") throw new Error("expected crease");
    const creaseData = crease.data;
    if (object.data.kind !== "polygon") throw new Error("expected polygon");
    const dx = creaseData.end.x - creaseData.start.x;
    const dy = creaseData.end.y - creaseData.start.y;
    const fixedIndex = object.data.points.findIndex(
      ({ x, y }) =>
        Math.abs(
          (x - creaseData.start.x) * dy - (y - creaseData.start.y) * dx,
        ) < 1e-7,
    );
    if (fixedIndex >= 0) expect(midpoint.points[fixedIndex].z).toBeCloseTo(0);
  });
});
