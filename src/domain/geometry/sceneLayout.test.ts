import { describe, expect, it } from "vitest";
import { compileExpression } from "../compiler/compileExpression";
import { parseExpression } from "../parser/parseExpression";
import { geometryBounds } from "./sceneLayout";

describe("single annotated final figure", () => {
  it("fits every object and embeds the factor arithmetic in the root construction", () => {
    const scene = compileExpression(parseExpression("(3*a + b) * (a + b)"), {
      a: 2,
      b: 1,
    });
    const [x, y, width, height] = scene.viewBox.split(" ").map(Number);
    const bounds = geometryBounds(scene.objects);
    expect(bounds.minX).toBeGreaterThan(x);
    expect(bounds.minY).toBeGreaterThan(y);
    expect(bounds.maxX).toBeLessThan(x + width);
    expect(bounds.maxY).toBeLessThan(y + height);
    expect(
      scene.objects.filter(({ id }) => id.startsWith("figure-part-")),
    ).toHaveLength(6);
    expect(
      scene.objects.filter(({ id }) => id.startsWith("figure-node-")),
    ).toHaveLength(4);
    expect(
      scene.objects.some(({ id }) => id.startsWith("layout-transfer-")),
    ).toBe(false);
    expect(
      scene.objects.filter(
        ({ role, kind }) => role === "result" && kind === "segment",
      ),
    ).toHaveLength(1);
  });

  it("aligns each reveal interval with its construction step", () => {
    const scene = compileExpression(parseExpression("a + b"), { a: 2, b: 1 });
    scene.revealActions.forEach((action) => {
      const index = scene.steps.findIndex(({ id }) => id === action.stepId);
      expect(action.start).toBeGreaterThanOrEqual(index / scene.steps.length);
      expect(action.end).toBeLessThanOrEqual((index + 1) / scene.steps.length);
    });
  });

  it("embeds powers and square roots into their final constructions", () => {
    const square = compileExpression(parseExpression("a^2"), { a: 3 });
    expect(
      square.objects.filter(
        ({ kind, represents }) => kind === "segment" && represents === "a",
      ),
    ).toHaveLength(2);
    expect(
      square.objects.some(
        ({ data }) => data.kind === "label" && data.text === "a²",
      ),
    ).toBe(true);

    const root = compileExpression(parseExpression("sqrt(a+b)"), {
      a: 3,
      b: 2,
    });
    expect(root.objects.some(({ kind }) => kind === "arc")).toBe(true);
    expect(
      root.objects.some(
        ({ data }) => data.kind === "label" && data.text === "1",
      ),
    ).toBe(true);
    expect(
      root.objects.some(
        ({ data }) => data.kind === "label" && data.text === "√(a + b)",
      ),
    ).toBe(true);
    expect(
      root.objects.filter(({ id }) => id.startsWith("figure-part-")),
    ).toHaveLength(2);

    const nested = compileExpression(parseExpression("sqrt(a+b^2)"), {
      a: 3,
      b: 2,
    });
    expect(nested.objects.some(({ kind }) => kind === "arc")).toBe(true);
    expect(
      nested.objects.filter(({ id }) => id.startsWith("figure-square-")),
    ).toHaveLength(11);
    expect(
      nested.objects.some(
        ({ data }) => data.kind === "label" && data.text === "b²",
      ),
    ).toBe(true);
    expect(
      nested.objects.some(
        ({ data }) => data.kind === "label" && data.text === "√(a + b²)",
      ),
    ).toBe(true);
  });
});
