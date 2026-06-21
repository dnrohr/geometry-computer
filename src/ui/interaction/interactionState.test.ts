import { compileExpression } from "../../domain/compiler/compileExpression";
import { parseExpression } from "../../domain/parser/parseExpression";
import { highlightedObjectIds, highlightedStepIds } from "./interactionState";

describe("interaction state derivation", () => {
  const scene = compileExpression(parseExpression("a+b"), { a: 2, b: 3 });
  const macro = scene.steps.find(({ operation }) => operation === "add")!;

  it("maps step hover to all inputs and outputs", () => {
    const ids = highlightedObjectIds(
      { hoveredStepId: macro.id },
      scene.steps,
      scene.objects,
    );
    macro.inputObjectIds.forEach((id) => expect(ids.has(id)).toBe(true));
    macro.outputObjectIds.forEach((id) => expect(ids.has(id)).toBe(true));
  });

  it("maps object and expression selection back to steps", () => {
    const selected = scene.objects.find(({ role }) => role === "result")!;
    const steps = highlightedStepIds(
      {
        selectedObjectId: selected.id,
        expressionObjectIds: [selected.id],
      },
      scene.objects,
    );
    expect(steps.has(selected.createdByStepId)).toBe(true);
    expect(steps.size).toBeGreaterThan(0);
  });
});
