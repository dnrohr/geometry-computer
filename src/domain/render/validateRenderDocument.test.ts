import {
  migrateRenderDocument,
  validateRenderDocument,
} from "./validateRenderDocument";
import { compileExpression } from "../compiler/compileExpression";
import { parseExpression } from "../parser/parseExpression";
import { constructionExport } from "../export/exportConstruction";

describe("render document v2", () => {
  const document = constructionExport(
    compileExpression(parseExpression("a+b"), { a: 3, b: 2 }),
  );

  it("validates canonical exports", () => {
    expect(() => validateRenderDocument(document)).not.toThrow();
    expect(document.version).toBe(2);
  });

  it("rejects broken object references", () => {
    const broken = structuredClone(document);
    broken.revealActions[0].objectId = "missing";
    expect(() => validateRenderDocument(broken)).toThrow("unknown object");
  });

  it("migrates legacy documents without changing geometry or timing", () => {
    const legacy = structuredClone(document) as Record<string, unknown>;
    delete legacy.metadata;
    const migrated = migrateRenderDocument({ ...legacy, version: 1 });
    expect(migrated.version).toBe(2);
    expect(migrated.objects).toEqual(document.objects);
    expect(migrated.revealActions).toEqual(document.revealActions);
  });

  it("shares canonical fixtures with the Python adapter", () => {
    const fixture = (name: string) =>
      JSON.parse(
        readFileSync(resolve("tools/manim_renderer/fixtures", name), "utf8"),
      ) as unknown;
    expect(() =>
      validateRenderDocument(fixture("valid_euclidean_v2.json")),
    ).not.toThrow();
    expect(() =>
      validateRenderDocument(fixture("valid_origami_v2.json")),
    ).not.toThrow();
    expect(
      migrateRenderDocument(fixture("legacy_euclidean_v1.json")).version,
    ).toBe(2);
    expect(() =>
      validateRenderDocument(fixture("invalid_unknown_object.json")),
    ).toThrow();
    expect(() =>
      validateRenderDocument(fixture("invalid_metadata.json")),
    ).toThrow();
  });
});
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
