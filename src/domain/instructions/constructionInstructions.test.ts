import type { ConstructionStep } from "../construction/types";
import { constructionInstructions } from "./constructionInstructions";

const step = (title: string): ConstructionStep => ({
  id: title,
  parentStepId: "sqrt",
  level: "primitive",
  title,
  summary: "summary",
  inputObjectIds: [],
  outputObjectIds: [],
  createdObjectIds: [],
});

describe("constructionInstructions", () => {
  it("explains the midpoint and circle construction", () => {
    const instructions = constructionInstructions(step("Draw the semicircle"));
    expect(instructions.join(" ")).toMatch(/equal arcs/i);
    expect(instructions.join(" ")).toMatch(/midpoint M/i);
    expect(instructions.join(" ")).toMatch(/compass to MA/i);
  });

  it("explains how to erect the perpendicular", () => {
    const instructions = constructionInstructions(
      step("Choose the upper intersection"),
    );
    expect(instructions.join(" ")).toMatch(/equally placed around B/i);
    expect(instructions.join(" ")).toMatch(/perpendicular/i);
  });
});
