import {
  compileOrigamiFunctionPreview,
  setOrigamiFunctionPreviewPhase,
} from "./functionPreview";
import { origamiFunctionScript } from "./functionScript";

describe("origamiFunctionScript", () => {
  it("exports a deterministic readable script for certified function plans", () => {
    const preview = compileOrigamiFunctionPreview("f(a)=sqrt(a+1)", { a: 3 });
    if (preview.status !== "compiled") throw new Error("Expected compiled");
    const jumped = setOrigamiFunctionPreviewPhase(
      preview,
      "origami-function-phase-9",
    );

    const script = origamiFunctionScript(jumped);

    expect(script).toContain("# Geometry Computer origami function script v1");
    expect(script).toContain("function f(a) = sqrt(a + 1)");
    expect(script).toContain("samples a=3");
    expect(script).toContain("result f(a) = sqrt(a + 1) = 2.000000");
    expect(script).toContain("solver ready certified=14/14");
    expect(script).toContain("active origami-function-phase-9 progress=0.57");
    expect(script).toContain(
      "09 origami-function-phase-9 align-fold status=proven-physical method=geometric-mean-square-root",
    );
    expect(script).toContain('expr="sqrt(a + 1)"');
  });

  it("keeps fallback solver work visible in script output", () => {
    const preview = compileOrigamiFunctionPreview("f(a)=a^3", { a: 2 });
    if (preview.status !== "compiled") throw new Error("Expected compiled");
    const jumped = setOrigamiFunctionPreviewPhase(
      preview,
      "origami-function-phase-3",
    );

    const script = origamiFunctionScript(jumped);

    expect(script).toContain("solver needs-solver certified=2/8");
    expect(script).toContain(
      "03 origami-function-phase-3 align-fold status=explanatory-fallback method=solver-work",
    );
    expect(script).toContain('expr="a^3"');
  });

  it("does not export blocked previews", () => {
    expect(
      origamiFunctionScript(compileOrigamiFunctionPreview("a/(b-b)")),
    ).toBeUndefined();
  });
});
