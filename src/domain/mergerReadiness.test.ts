import { compileExpression } from "./compiler/compileExpression";
import { parseExpression } from "./parser/parseExpression";
import { compileOrigamiExpression } from "./origami/compiler/compileOrigamiExpression";

describe("origami and compass-straightedge merger readiness", () => {
  it("compares addition traces without requiring a shared compiler abstraction", () => {
    const ast = parseExpression("a+b");
    const values = { a: 3, b: 2 };
    const compass = compileExpression(ast, values, "a+b", "a+b");
    const origami = compileOrigamiExpression(ast, values, "a+b");

    expect(compass.value).toBe(5);
    expect(origami.value).toBe(5);
    expect(compass.ast).toEqual(origami.ast);
    expect(compass.steps.some(({ operation }) => operation === "add")).toBe(
      true,
    );
    expect(origami.steps.some(({ operation }) => operation === "add")).toBe(
      true,
    );
    expect(compass.objects.find(({ role }) => role === "result")).toMatchObject(
      {
        represents: "a + b",
      },
    );
    expect(origami.objects.find(({ role }) => role === "result")).toMatchObject(
      {
        provenance: { expression: "a + b" },
      },
    );
    const compassObjectIds = new Set(compass.objects.map(({ id }) => id));
    const sharedObjectIds = origami.objects
      .map(({ id }) => id)
      .filter((id) => compassObjectIds.has(id));
    expect(sharedObjectIds).toEqual([]);
  });
});
