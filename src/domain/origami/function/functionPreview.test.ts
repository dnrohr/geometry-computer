import {
  advanceOrigamiFunctionPreview,
  compileOrigamiFunctionPreview,
} from "./functionPreview";

describe("origami function preview plan", () => {
  it("compiles a valid function input into deterministic preview phases", () => {
    const preview = compileOrigamiFunctionPreview("sqrt(a+1)");

    expect(preview.status).toBe("compiled");
    if (preview.status !== "compiled") throw new Error("Expected compiled");
    expect(preview.plan).toMatchObject({
      id: "origami-function-plan-sqrt-a-1",
      resultObjectId: "origami-function-result",
      phases: [
        { kind: "place-paper" },
        { kind: "mark-input", expression: "a" },
        { kind: "extract-result", expression: "sqrt(a + 1)" },
      ],
    });
    expect(preview.animation).toMatchObject({
      planId: preview.plan.id,
      phaseId: "origami-function-phase-1",
      progress: 0,
    });
    expect(preview.paperStyle.frontPattern).toBe("grid");
  });

  it("blocks preview compilation for invalid sampled domains", () => {
    const preview = compileOrigamiFunctionPreview("a/(b-b)");

    expect(preview.status).toBe("blocked");
    if (preview.status !== "blocked") throw new Error("Expected blocked");
    expect(preview.input.status).toBe("blocked");
  });

  it("advances animation progress without leaving the compiled plan", () => {
    const preview = compileOrigamiFunctionPreview("a+b");
    if (preview.status !== "compiled") throw new Error("Expected compiled");

    const advanced = advanceOrigamiFunctionPreview(preview, 0.5);

    expect(advanced.status).toBe("compiled");
    if (advanced.status !== "compiled") throw new Error("Expected compiled");
    expect(advanced.plan).toBe(preview.plan);
    expect(advanced.animation.progress).toBe(0.5);
    expect(advanced.animation.phaseId).toBe("origami-function-phase-3");
  });
});
