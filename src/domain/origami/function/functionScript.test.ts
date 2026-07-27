import {
  compileOrigamiFunctionPreview,
  setOrigamiFunctionPreviewPhase,
  setOrigamiFunctionPreviewPaperStyle,
} from "./functionPreview";
import {
  origamiFunctionConstructionScript,
  origamiFunctionScript,
  replayOrigamiFunctionScript,
} from "./functionScript";

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

  it("exports an inspection-oriented construction script", () => {
    const preview = compileOrigamiFunctionPreview("f(a,b)=(a+b)*(a+b)", {
      a: 2,
      b: 3,
    });
    if (preview.status !== "compiled") throw new Error("Expected compiled");

    const script = origamiFunctionConstructionScript(preview);

    expect(script).toContain(
      "# Geometry Computer origami construction script v1",
    );
    expect(script).toContain("function f(a, b) = (a + b) * (a + b)");
    expect(script).toContain("samples a=2, b=3");
    expect(script).toContain("verification verified issues=0");
    expect(script).toContain("nodes\n1 origami-function-node-1 kind=input");
    expect(script).toContain("\noperations\n");
    expect(script).toContain("kind=reuse-length");
    expect(script).toContain("\nphases\n");
    expect(script).toContain("method=intercept-product-transfer");
    expect(script).toContain("\ntransfers\n");
    expect(script).toContain(
      'origami-function-transfer-1 expr="a + b" from=origami-function-node-3',
    );
    expect(script).toContain("\nverificationIssues\nnone\n");
  });

  it("does not export construction scripts for blocked previews", () => {
    expect(
      origamiFunctionConstructionScript(
        compileOrigamiFunctionPreview("a/(b-b)"),
      ),
    ).toBeUndefined();
  });

  it("replays a readable script through the origami compiler boundary", () => {
    const preview = compileOrigamiFunctionPreview("f(a,b)=a*b", {
      a: 4,
      b: 1.5,
    });
    if (preview.status !== "compiled") throw new Error("Expected compiled");
    const styled = setOrigamiFunctionPreviewPaperStyle(preview, {
      frontColor: "#ffffff",
      backColor: "#101820",
      frontPattern: "washi-wave",
      backPattern: "high-contrast",
      patternScale: 1.75,
      patternRotation: 45,
    });
    const jumped = setOrigamiFunctionPreviewPhase(
      styled,
      "origami-function-phase-4",
    );
    const script = origamiFunctionScript(jumped);
    if (!script) throw new Error("Expected script");

    const replay = replayOrigamiFunctionScript(script);

    expect(replay.status).toBe("replayed");
    if (replay.status !== "replayed") throw new Error(replay.error);
    expect(replay.source).toBe("f(a, b) = a * b");
    expect(replay.values).toEqual({ a: 4, b: 1.5 });
    expect(replay.preview.animation.phaseId).toBe("origami-function-phase-4");
    expect(replay.preview.paperStyle.frontColor).toBe("#ffffff");
    expect(replay.preview.paperStyle.backPattern).toBe("high-contrast");
    expect(replay.preview.paperStyle.patternScale).toBe(1.75);
  });

  it("rejects stale or malformed readable scripts", () => {
    expect(replayOrigamiFunctionScript("not a script")).toMatchObject({
      status: "error",
      error: "Import must be a version 1 function script.",
    });
    expect(
      replayOrigamiFunctionScript(
        [
          "# Geometry Computer origami function script v1",
          "function f(a) = sqrt(a + 1)",
          "samples a=3",
          "active missing-phase progress=0.50",
        ].join("\n"),
      ),
    ).toMatchObject({
      status: "error",
      error: "Import script references an unknown phase.",
    });
  });
});
