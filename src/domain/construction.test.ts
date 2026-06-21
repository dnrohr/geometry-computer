import { createConstructionDrawing } from "./construction";
import { buildConstructionPlan, parseExpression } from "./expression";

function drawingFor(source: string) {
  const plan = buildConstructionPlan(parseExpression(source));
  return createConstructionDrawing(plan.at(-1)!);
}

describe("geometric construction drawings", () => {
  it.each([
    ["2 + 3", "Segment concatenation"],
    ["5 - 2", "Segment difference"],
    ["2 * 3", "Fourth proportional"],
    ["6 / 2", "Third proportional"],
    ["sqrt(2)", "Geometric mean"],
  ])("maps %s to the %s method", (source, title) => {
    const drawing = drawingFor(source);

    expect(drawing.title).toBe(title);
    expect(drawing.method).not.toBe("");
    expect(drawing.primitives.length).toBeGreaterThan(4);
  });

  it("marks every constructed result in the drawing", () => {
    const drawing = drawingFor("sqrt(2)");

    expect(drawing.primitives).toContainEqual(
      expect.objectContaining({ type: "label", role: "result" }),
    );
    expect(drawing.primitives).toContainEqual(
      expect.objectContaining({ type: "line", role: "result" }),
    );
  });
});
