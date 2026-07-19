import { simplePointToPointFoldScene } from "./examples";
import {
  creaseObject,
  paperBoundaryObject,
  pointObject,
  reflectedPointObject,
  type OrigamiObjectMetadata,
} from "./types";
import {
  OrigamiSceneError,
  validateOrigamiScene,
} from "./validateOrigamiScene";

const metadata = (
  id: string,
  role: OrigamiObjectMetadata["role"] = "input",
  sourceObjectIds: string[] = [],
  createdByStepId?: string,
): OrigamiObjectMetadata => ({
  id,
  role,
  createdByStepId,
  usedByStepIds: [],
  dependsOnObjectIds: sourceObjectIds,
  provenance: {
    foldStepId: createdByStepId,
    sourceObjectIds,
  },
});

describe("origami domain model", () => {
  it("creates typed objects with origami-specific provenance", () => {
    const paper = paperBoundaryObject(
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 },
      ],
      metadata("paper", "paper"),
    );
    const point = pointObject({ x: 0.25, y: 0.5 }, metadata("point-a"));
    const crease = creaseObject(
      { point: { x: 0.5, y: 0 }, direction: { x: 0, y: 1 } },
      "unassigned",
      metadata("crease", "crease", ["point-a"], "fold-1"),
      "solution-1",
    );
    const reflected = reflectedPointObject(
      "point-a",
      "crease",
      { x: 0.75, y: 0.5 },
      metadata("reflected-a", "reflection", ["point-a", "crease"], "fold-1"),
    );

    expect(paper.kind).toBe("paper-boundary");
    expect(point.kind).toBe("point");
    expect(crease).toMatchObject({
      kind: "crease",
      data: { assignment: "unassigned", solutionId: "solution-1" },
      provenance: { foldStepId: "fold-1" },
    });
    expect(reflected).toMatchObject({
      kind: "reflected-point",
      dependsOnObjectIds: ["point-a", "crease"],
    });
  });

  it("provides deterministic fixture IDs and valid references", () => {
    const first = simplePointToPointFoldScene();
    const second = simplePointToPointFoldScene();

    expect(first).toEqual(second);
    expect(first.objects.map(({ id }) => id)).toEqual([
      "paper-square",
      "point-a",
      "point-b",
      "crease-a-to-b",
      "reflected-point-a",
    ]);
    expect(first.steps[0]).toMatchObject({
      id: "fold-1",
      axiom: "point-to-point",
      selectedSolutionId: "solution-1",
      outputObjectIds: ["crease-a-to-b", "reflected-point-a"],
    });
  });

  it("keeps scenes JSON-safe", () => {
    const scene = simplePointToPointFoldScene();
    expect(JSON.parse(JSON.stringify(scene))).toEqual(scene);
  });

  it("reports duplicate IDs with a readable validation error", () => {
    const scene = simplePointToPointFoldScene();
    expect(() =>
      validateOrigamiScene({
        ...scene,
        objects: [...scene.objects, { ...scene.objects[0] }],
      }),
    ).toThrow(
      new OrigamiSceneError(
        "Duplicate object id paper-square.",
        "DUPLICATE_ID",
      ),
    );
  });

  it("reports missing references without returning partial scenes", () => {
    const scene = simplePointToPointFoldScene();
    expect(() =>
      validateOrigamiScene({
        ...scene,
        steps: [
          {
            ...scene.steps[0],
            inputObjectIds: ["missing-point"],
          },
        ],
      }),
    ).toThrow(/missing-point referenced by fold-1 does not exist/i);
  });

  it("validates arithmetic macro trace object and proof-claim references", () => {
    const scene = simplePointToPointFoldScene();
    const stepWithMacroTrace = {
      ...scene.steps[0],
      operation: "mul" as const,
      macroTrace: {
        macroId: "fold-1",
        operation: "mul" as const,
        sourceSegmentObjectIds: ["point-a"],
        unitReferenceObjectIds: [],
        guideLineObjectIds: [],
        foldCreaseObjectIds: ["missing-crease"],
        reflectedObjectIds: [],
        selectedIntersectionObjectIds: [],
        resultSegmentObjectIds: ["crease-a-to-b"],
        proofClaimIds: ["claim-1"],
        branchSelections: [
          {
            id: "branch-1",
            label: "Selected branch",
            selected: true,
            reason: "Fixture branch choice.",
          },
        ],
        degeneracyObjectIds: [],
      },
    };

    expect(() =>
      validateOrigamiScene({
        ...scene,
        steps: [stepWithMacroTrace],
      }),
    ).toThrow(/missing-crease referenced by fold-1 does not exist/i);

    expect(() =>
      validateOrigamiScene({
        ...scene,
        steps: [
          {
            ...stepWithMacroTrace,
            macroTrace: {
              ...stepWithMacroTrace.macroTrace,
              foldCreaseObjectIds: ["crease-a-to-b"],
              proofClaimIds: ["missing-claim"],
            },
          },
        ],
      }),
    ).toThrow(/missing-claim referenced by fold-1 does not exist/i);
  });

  it("rejects non-finite coordinates and zero direction folds", () => {
    const scene = simplePointToPointFoldScene();
    expect(() =>
      validateOrigamiScene({
        ...scene,
        objects: [
          ...scene.objects.filter(({ id }) => id !== "point-a"),
          pointObject({ x: Number.NaN, y: 0 }, metadata("point-a")),
        ],
      }),
    ).toThrow(/non-finite coordinate/i);

    expect(() =>
      validateOrigamiScene({
        ...scene,
        objects: [
          ...scene.objects.filter(({ id }) => id !== "crease-a-to-b"),
          creaseObject(
            { point: { x: 5, y: 5 }, direction: { x: 0, y: 0 } },
            "unassigned",
            metadata(
              "crease-a-to-b",
              "crease",
              ["point-a", "point-b"],
              "fold-1",
            ),
          ),
        ],
      }),
    ).toThrow(/zero direction vector/i);
  });
});
