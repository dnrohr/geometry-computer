import {
  ORIGAMI_PAPER_PALETTE_MIN_CONTRAST,
  origamiFunctionPaperPalettes,
  origamiPaperPaletteHasContrast,
  randomOrigamiPaperPalette,
} from "./paperPalettes";

describe("origami function paper palettes", () => {
  it("provides named palettes that preserve front/back contrast", () => {
    expect(origamiFunctionPaperPalettes.map(({ name }) => name)).toEqual([
      "Classic grid",
      "Mint ink",
      "Coral night",
      "Blueprint gold",
    ]);
    expect(
      origamiFunctionPaperPalettes.every(origamiPaperPaletteHasContrast),
    ).toBe(true);
    expect(ORIGAMI_PAPER_PALETTE_MIN_CONTRAST).toBe(3);
  });

  it("selects a different random palette from the current named palette", () => {
    expect(randomOrigamiPaperPalette("classic-grid", () => 0).id).toBe(
      "mint-ink",
    );
    expect(randomOrigamiPaperPalette("classic-grid", () => 0.99).id).toBe(
      "blueprint-gold",
    );
    expect(randomOrigamiPaperPalette("unknown", () => 0).id).toBe("mint-ink");
  });
});
