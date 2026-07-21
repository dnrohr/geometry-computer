import {
  compileOrigamiFunctionPreview,
  origamiFunctionAnimatedSvg,
  setOrigamiFunctionPreviewPaperStyle,
} from "./index";

describe("origamiFunctionAnimatedSvg", () => {
  it("exports a deterministic animated SVG with phase and crease provenance", () => {
    const preview = compileOrigamiFunctionPreview("sqrt(a+1)");
    if (preview.status !== "compiled") throw new Error("Expected compiled");
    const styled = setOrigamiFunctionPreviewPaperStyle(preview, {
      frontColor: "#ffffff",
      creaseColor: "#ffcc66",
      opacity: 0.65,
    });

    const svg = origamiFunctionAnimatedSvg(styled);

    expect(svg).toContain(
      'data-animation-kind="origami-function-animated-svg"',
    );
    expect(svg).toContain('data-plan-id="origami-function-plan-f-a-sqrt-a-1"');
    expect(svg).toContain('data-phase-count="14"');
    expect(svg).toContain('fill="#ffffff" opacity="0.65"');
    expect(svg).toContain('data-frame-phase-id="origami-function-phase-9"');
    expect(svg).toContain('data-frame-physical-status="explanatory-fallback"');
    expect(svg).toContain('data-crease-phase-id="origami-function-phase-4"');
    expect(svg).toContain('stroke="#ffcc66"');
    expect(svg).toContain("Final 2.000");
    expect(svg).toContain("<set attributeName=");
  });

  it("does not export blocked function previews", () => {
    expect(
      origamiFunctionAnimatedSvg(compileOrigamiFunctionPreview("a/(b-b)")),
    ).toBeUndefined();
  });
});
