import {
  creaseObject,
  paperBoundaryObject,
  pointObject,
  reflectedPointObject,
  type OrigamiFoldScene,
  type OrigamiObjectMetadata,
} from "../types";
import { validateOrigamiScene } from "../validateOrigamiScene";

const metadata = (
  id: string,
  role: OrigamiObjectMetadata["role"],
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

export const simplePointToPointFoldScene = (): OrigamiFoldScene =>
  validateOrigamiScene({
    id: "origami-scene-point-to-point",
    title: "Fold A onto B",
    description:
      "A minimal flat-origami scene whose crease is the perpendicular bisector mapping point A to point B.",
    objects: [
      paperBoundaryObject(
        [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
          { x: 0, y: 10 },
        ],
        metadata("paper-square", "paper"),
      ),
      pointObject({ x: 3, y: 5 }, metadata("point-a", "input")),
      pointObject({ x: 7, y: 5 }, metadata("point-b", "input")),
      creaseObject(
        {
          point: { x: 5, y: 5 },
          direction: { x: 0, y: 1 },
        },
        "unassigned",
        metadata("crease-a-to-b", "crease", ["point-a", "point-b"], "fold-1"),
        "solution-1",
      ),
      reflectedPointObject(
        "point-a",
        "crease-a-to-b",
        { x: 7, y: 5 },
        metadata(
          "reflected-point-a",
          "reflection",
          ["point-a", "crease-a-to-b"],
          "fold-1",
        ),
      ),
    ],
    steps: [
      {
        id: "fold-1",
        title: "Fold A onto B",
        summary:
          "Crease the perpendicular bisector of AB so point A reflects onto point B.",
        axiom: "point-to-point",
        inputObjectIds: ["point-a", "point-b"],
        outputObjectIds: ["crease-a-to-b", "reflected-point-a"],
        createdObjectIds: ["crease-a-to-b", "reflected-point-a"],
        selectedSolutionId: "solution-1",
        proofId: "proof-point-to-point",
      },
    ],
    revealActions: [
      {
        id: "reveal-crease",
        stepId: "fold-1",
        objectId: "crease-a-to-b",
        start: 0,
        end: 0.5,
        animation: "draw",
      },
      {
        id: "reveal-reflection",
        stepId: "fold-1",
        objectId: "reflected-point-a",
        start: 0.5,
        end: 1,
        animation: "fade-in",
      },
    ],
    proofs: [
      {
        id: "proof-point-to-point",
        title: "Point-to-point fold",
        axiom: "point-to-point",
        intuition:
          "A fold mapping one point to another must lie equally far from both points.",
        givens: ["Point A", "Point B"],
        claims: [
          {
            id: "claim-bisector",
            text: "The crease is the perpendicular bisector of AB.",
            mathLatex: "d(P,A)=d(P,B)",
            highlightObjectIds: ["point-a", "point-b", "crease-a-to-b"],
          },
        ],
        conclusion: "Reflecting A across the crease lands on B.",
      },
    ],
  });
