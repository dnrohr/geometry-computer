import type { RenderDocumentV2 } from "../render/types";
import type { OrigamiExample } from "./examples";

export type OrigamiTracePhase = {
  id: string;
  time: number;
  title: string;
  summary: string;
  instruction: string;
  objectIds: string[];
};

export function buildOrigamiTrace(
  example: OrigamiExample,
  document: RenderDocumentV2,
): OrigamiTracePhase[] {
  const polygons = document.objects
    .filter(({ kind }) => kind === "polygon")
    .map(({ id }) => id);
  const annotations = document.objects
    .filter(
      ({ role }) =>
        role === "proof-highlight" || role === "result" || role === "reference",
    )
    .map(({ id }) => id);
  const folds = document.revealActions.filter(
    ({ animation }) => animation === "fold",
  );
  const creaseAction = document.revealActions.find(({ objectId }) =>
    objectId.includes("crease"),
  );
  const unfolds = document.revealActions.filter(
    ({ animation }) => animation === "unfold",
  );
  return [
    {
      id: "prepare",
      time: 0,
      title: "Prepare the sheet",
      summary: "Start with the original paper state.",
      instruction: "Lay the sheet flat with its front face upward.",
      objectIds: polygons,
    },
    {
      id: "identify",
      time: Math.min(
        ...document.revealActions
          .filter(({ objectId }) => annotations.includes(objectId))
          .map(({ start }) => start),
        0.1,
      ),
      title: "Identify the match",
      summary: example.solutionDescription,
      instruction: `Locate the marked source and target. The ${example.movingSide} side will move.`,
      objectIds: annotations,
    },
    {
      id: "fold",
      time: Math.min(...folds.map(({ start }) => start)),
      title: "Make the fold",
      summary: `Reflect the ${example.movingSide} side across the computed crease.`,
      instruction:
        "Bring the source marker precisely onto the target while keeping the crease fixed.",
      objectIds: [
        ...folds.map(({ objectId }) => objectId),
        ...document.objects
          .filter(({ kind }) => kind === "crease")
          .map(({ id }) => id),
      ],
    },
    ...(creaseAction
      ? [
          {
            id: "crease",
            time: creaseAction.start,
            title: "Set the crease",
            summary: "The folded paper reaches its exact computed target.",
            instruction:
              "Press along the crease, keeping the aligned markers together.",
            objectIds: [creaseAction.objectId],
          },
        ]
      : []),
    ...unfolds.slice(0, 1).map((action) => ({
      id: "unfold",
      time: action.start,
      title: "Unfold the sheet",
      summary:
        "Return the paper to its original position while retaining the crease.",
      instruction: "Open the paper without erasing the crease you made.",
      objectIds: [
        action.objectId,
        ...(creaseAction ? [creaseAction.objectId] : []),
      ],
    })),
    {
      id: "complete",
      time: document.metadata.duration,
      title: "Construction complete",
      summary: example.unfold
        ? "The crease remains on the open sheet."
        : "The paper rests in its final folded state.",
      instruction: "Inspect the final alignment and crease.",
      objectIds: document.objects.map(({ id }) => id),
    },
  ];
}

export function activeTracePhase(phases: OrigamiTracePhase[], time: number) {
  return (
    [...phases].reverse().find((phase) => phase.time <= time + 1e-6) ??
    phases[0]
  );
}
