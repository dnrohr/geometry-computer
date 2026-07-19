import type {
  OrigamiFoldScene,
  OrigamiLine,
  OrigamiObject,
  OrigamiPoint,
} from "./types";

export class OrigamiSceneError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
  }
}

const assertUniqueIds = (label: string, ids: string[]) => {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id))
      throw new OrigamiSceneError(
        `Duplicate ${label} id ${id}.`,
        "DUPLICATE_ID",
      );
    seen.add(id);
  }
};

const assertKnownIds = (
  label: string,
  ids: string[],
  knownIds: Set<string>,
  ownerId: string,
) => {
  for (const id of ids) {
    if (!knownIds.has(id))
      throw new OrigamiSceneError(
        `${label} ${id} referenced by ${ownerId} does not exist.`,
        "MISSING_REFERENCE",
      );
  }
};

const assertFinitePoint = (point: OrigamiPoint, ownerId: string) => {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y))
    throw new OrigamiSceneError(
      `Object ${ownerId} contains a non-finite coordinate.`,
      "NON_FINITE_COORDINATE",
    );
};

const assertFiniteLine = (line: OrigamiLine, ownerId: string) => {
  assertFinitePoint(line.point, ownerId);
  assertFinitePoint(line.direction, ownerId);
  if (line.direction.x === 0 && line.direction.y === 0)
    throw new OrigamiSceneError(
      `Object ${ownerId} has a zero direction vector.`,
      "ZERO_DIRECTION",
    );
};

const assertFiniteObject = (object: OrigamiObject) => {
  switch (object.data.kind) {
    case "paper-boundary":
      object.data.points.forEach((point) =>
        assertFinitePoint(point, object.id),
      );
      return;
    case "point":
    case "label":
      assertFinitePoint(object.data.position, object.id);
      return;
    case "line":
    case "crease":
      assertFiniteLine(object.data.line, object.id);
      return;
    case "segment":
      assertFinitePoint(object.data.start, object.id);
      assertFinitePoint(object.data.end, object.id);
      return;
    case "reflected-point":
      assertFinitePoint(object.data.position, object.id);
      return;
  }
};

export function validateOrigamiScene(scene: OrigamiFoldScene) {
  assertUniqueIds(
    "object",
    scene.objects.map(({ id }) => id),
  );
  assertUniqueIds(
    "step",
    scene.steps.map(({ id }) => id),
  );
  assertUniqueIds(
    "proof",
    scene.proofs.map(({ id }) => id),
  );
  assertUniqueIds(
    "reveal",
    scene.revealActions.map(({ id }) => id),
  );

  const objectIds = new Set(scene.objects.map(({ id }) => id));
  const stepIds = new Set(scene.steps.map(({ id }) => id));
  const proofIds = new Set(scene.proofs.map(({ id }) => id));
  const proofClaimIds = new Set(
    scene.proofs.flatMap((proof) => proof.claims.map(({ id }) => id)),
  );

  scene.objects.forEach((object) => {
    assertFiniteObject(object);
    assertKnownIds(
      "Source object",
      object.provenance.sourceObjectIds,
      objectIds,
      object.id,
    );
    assertKnownIds(
      "Dependency object",
      object.dependsOnObjectIds,
      objectIds,
      object.id,
    );
    if (object.createdByStepId && !stepIds.has(object.createdByStepId))
      throw new OrigamiSceneError(
        `Object ${object.id} was created by missing step ${object.createdByStepId}.`,
        "MISSING_REFERENCE",
      );
    if (object.data.kind === "reflected-point") {
      assertKnownIds(
        "Reflected source object",
        [object.data.originalObjectId, object.data.creaseObjectId],
        objectIds,
        object.id,
      );
    }
  });

  scene.steps.forEach((step) => {
    assertKnownIds("Input object", step.inputObjectIds, objectIds, step.id);
    assertKnownIds("Output object", step.outputObjectIds, objectIds, step.id);
    assertKnownIds("Created object", step.createdObjectIds, objectIds, step.id);
    step.degeneracies?.forEach((degeneracy) =>
      assertKnownIds(
        "Degenerate object",
        degeneracy.objectIds,
        objectIds,
        step.id,
      ),
    );
    if (step.macroTrace) {
      const traceObjectReferences = [
        ...step.macroTrace.sourceSegmentObjectIds,
        ...step.macroTrace.unitReferenceObjectIds,
        ...step.macroTrace.guideLineObjectIds,
        ...step.macroTrace.foldCreaseObjectIds,
        ...step.macroTrace.reflectedObjectIds,
        ...step.macroTrace.selectedIntersectionObjectIds,
        ...step.macroTrace.resultSegmentObjectIds,
        ...step.macroTrace.degeneracyObjectIds,
      ];
      assertKnownIds(
        "Macro trace object",
        traceObjectReferences,
        objectIds,
        step.id,
      );
      assertKnownIds(
        "Macro trace proof claim",
        step.macroTrace.proofClaimIds,
        proofClaimIds,
        step.id,
      );
    }
    if (step.proofId && !proofIds.has(step.proofId))
      throw new OrigamiSceneError(
        `Step ${step.id} references missing proof ${step.proofId}.`,
        "MISSING_REFERENCE",
      );
  });

  scene.proofs.forEach((proof) => {
    proof.claims.forEach((claim) =>
      assertKnownIds(
        "Proof highlight object",
        claim.highlightObjectIds,
        objectIds,
        claim.id,
      ),
    );
  });

  scene.revealActions.forEach((action) => {
    assertKnownIds("Reveal step", [action.stepId], stepIds, action.id);
    assertKnownIds("Reveal object", [action.objectId], objectIds, action.id);
    if (action.end < action.start)
      throw new OrigamiSceneError(
        `Reveal action ${action.id} ends before it starts.`,
        "INVALID_REVEAL_RANGE",
      );
  });

  return scene;
}
