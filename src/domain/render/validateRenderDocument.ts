import type {
  LegacyRenderDocumentV1,
  RenderDocument,
  RenderDocumentV2,
} from "./types";

const KINDS = new Set([
  "point",
  "segment",
  "line",
  "ray",
  "circle",
  "arc",
  "label",
  "triangle",
  "polygon",
  "crease",
  "arrow",
]);
const ANIMATIONS = new Set([
  "draw",
  "fade-in",
  "fade-out",
  "pulse",
  "highlight",
  "select",
  "dim",
  "fold",
  "unfold",
]);

export class RenderDocumentError extends Error {}

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const nonempty = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;
const stringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");
const point = (value: unknown) =>
  record(value) && finite(value.x) && finite(value.y);

function fail(message: string): never {
  throw new RenderDocumentError(message);
}

export function parseViewBox(value: unknown) {
  if (typeof value !== "string") fail("viewBox must be a string");
  const values = value.trim().split(/\s+/).map(Number);
  if (values.length !== 4 || values.some((item) => !Number.isFinite(item)))
    fail("viewBox must contain four finite numbers");
  if (values[2] <= 0 || values[3] <= 0)
    fail("viewBox dimensions must be positive");
  return values as [number, number, number, number];
}

function validateGeometryData(kind: string, data: unknown, path: string) {
  if (!record(data) || data.kind !== kind)
    fail(`${path}.data.kind must match ${kind}`);
  if (kind === "point" && !point(data.position))
    fail(`${path} needs a finite position`);
  if (
    ["segment", "line", "ray", "crease", "arrow"].includes(kind) &&
    (!point(data.start) || !point(data.end))
  )
    fail(`${path} needs finite start and end points`);
  if (
    kind === "circle" &&
    (!point(data.center) || !finite(data.radius) || data.radius < 0)
  )
    fail(`${path} needs a finite center and nonnegative radius`);
  if (
    kind === "arc" &&
    (!point(data.center) ||
      !finite(data.radius) ||
      data.radius < 0 ||
      !finite(data.startAngle) ||
      !finite(data.endAngle))
  )
    fail(`${path} has invalid arc geometry`);
  if (
    kind === "label" &&
    (!point(data.position) || typeof data.text !== "string")
  )
    fail(`${path} has invalid label geometry`);
  if (["triangle", "polygon"].includes(kind)) {
    if (
      !Array.isArray(data.points) ||
      data.points.length < 3 ||
      !data.points.every(point)
    )
      fail(`${path} needs at least three finite points`);
    if (kind === "triangle" && data.points.length !== 3)
      fail(`${path} must have three points`);
    if (
      kind === "polygon" &&
      ((data.layer !== undefined && !finite(data.layer)) ||
        (data.side !== undefined &&
          !["front", "back"].includes(String(data.side))))
    )
      fail(`${path} has invalid paper material or layer data`);
  }
}

export function validateRenderDocument(
  value: unknown,
): asserts value is RenderDocument {
  if (!record(value) || (value.version !== 1 && value.version !== 2))
    fail("render document version must be 1 or 2");
  parseViewBox(value.viewBox);
  if (
    !Array.isArray(value.objects) ||
    !Array.isArray(value.revealActions) ||
    !Array.isArray(value.steps) ||
    !Array.isArray(value.proofs)
  )
    fail("objects, steps, revealActions, and proofs must be arrays");
  if (
    typeof value.expression !== "string" ||
    typeof value.simplifiedExpression !== "string" ||
    !record(value.values)
  )
    fail("expression, simplifiedExpression, and values are required");
  if (!Object.values(value.values).every(finite))
    fail("all supplied values must be finite numbers");

  if (value.version === 2) {
    const metadata = value.metadata;
    if (
      !record(metadata) ||
      metadata.schema !== "geometry-computer/render-document" ||
      !record(metadata.generator) ||
      metadata.generator.name !== "geometry-computer" ||
      !nonempty(metadata.generator.version) ||
      !nonempty(metadata.title) ||
      !record(metadata.aspectRatio) ||
      !finite(metadata.aspectRatio.width) ||
      !finite(metadata.aspectRatio.height) ||
      metadata.aspectRatio.width <= 0 ||
      metadata.aspectRatio.height <= 0 ||
      !nonempty(metadata.theme) ||
      !finite(metadata.duration) ||
      metadata.duration < 0
    )
      fail("version 2 metadata is invalid");
  }

  const objectIds = new Set<string>();
  for (const [index, item] of value.objects.entries()) {
    const path = `objects[${index}]`;
    if (
      !record(item) ||
      !nonempty(item.id) ||
      !nonempty(item.kind) ||
      !KINDS.has(item.kind) ||
      !nonempty(item.role) ||
      !nonempty(item.createdByStepId) ||
      !stringArray(item.usedByStepIds) ||
      !stringArray(item.dependsOnObjectIds)
    )
      fail(`${path} has invalid identity or provenance`);
    if (objectIds.has(item.id)) fail(`duplicate object id: ${item.id}`);
    objectIds.add(item.id);
    validateGeometryData(item.kind, item.data, path);
  }
  for (const item of value.objects)
    for (const dependency of item.dependsOnObjectIds)
      if (!objectIds.has(dependency))
        fail(`object ${item.id} references unknown dependency ${dependency}`);

  const actionIds = new Set<string>();
  for (const [index, action] of value.revealActions.entries()) {
    const path = `revealActions[${index}]`;
    if (
      !record(action) ||
      !nonempty(action.id) ||
      !nonempty(action.stepId) ||
      !nonempty(action.objectId) ||
      !objectIds.has(action.objectId) ||
      !nonempty(action.animation) ||
      !ANIMATIONS.has(action.animation) ||
      !finite(action.start) ||
      !finite(action.end) ||
      action.start < 0 ||
      action.end < action.start
    )
      fail(`${path} is invalid or references an unknown object`);
    if (actionIds.has(action.id)) fail(`duplicate action id: ${action.id}`);
    actionIds.add(action.id);
    if (
      ["fold", "unfold"].includes(action.animation) &&
      (!nonempty(action.creaseObjectId) ||
        !objectIds.has(action.creaseObjectId) ||
        !Array.isArray(action.targetPoints) ||
        action.targetPoints.length < 3 ||
        !action.targetPoints.every(point) ||
        !["left", "right"].includes(String(action.movingSide)))
    )
      fail(`${path} has invalid fold data`);
    if (
      ["fold", "unfold"].includes(action.animation) &&
      ((action.targetLayer !== undefined && !finite(action.targetLayer)) ||
        (action.targetSide !== undefined &&
          !["front", "back"].includes(String(action.targetSide))))
    )
      fail(`${path} has invalid target layer or material`);
  }
}

export function migrateRenderDocument(value: unknown): RenderDocumentV2 {
  validateRenderDocument(value);
  if (value.version === 2) return value;
  const legacy = value as LegacyRenderDocumentV1;
  const [, , width, height] = parseViewBox(legacy.viewBox);
  return {
    ...legacy,
    version: 2,
    metadata: {
      schema: "geometry-computer/render-document",
      generator: { name: "geometry-computer", version: "0.1.0" },
      title: legacy.expression || "Geometric construction",
      aspectRatio: { width, height },
      theme: "geometry-computer-dark",
      duration: Math.max(0, ...legacy.revealActions.map(({ end }) => end)),
    },
  };
}
