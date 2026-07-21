import type { OrigamiPaperStyle } from "./types";

export type OrigamiFunctionPaperPalette = {
  id: string;
  name: string;
  style: OrigamiPaperStyle;
};

const hexChannel = (hex: string, start: number) =>
  Number.parseInt(hex.slice(start, start + 2), 16) / 255;

const linearizedChannel = (channel: number) =>
  channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;

export const origamiPaperContrastRatio = (a: string, b: string) => {
  const luminance = (hex: string) => {
    const normalized = hex.trim().replace(/^#/, "");
    if (!/^[0-9a-f]{6}$/i.test(normalized)) return 1;
    const red = linearizedChannel(hexChannel(normalized, 0));
    const green = linearizedChannel(hexChannel(normalized, 2));
    const blue = linearizedChannel(hexChannel(normalized, 4));
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  };
  const light = Math.max(luminance(a), luminance(b));
  const dark = Math.min(luminance(a), luminance(b));
  return (light + 0.05) / (dark + 0.05);
};

export const ORIGAMI_PAPER_PALETTE_MIN_CONTRAST = 3;

export const origamiFunctionPaperPalettes: OrigamiFunctionPaperPalette[] = [
  {
    id: "classic-grid",
    name: "Classic grid",
    style: {
      frontColor: "#f7f0d4",
      backColor: "#365f91",
      frontPattern: "grid",
      backPattern: "diagonal-stripe",
      creaseColor: "#e8b65c",
      highlightColor: "#fff2bb",
      opacity: 1,
      patternScale: 1,
      patternRotation: 0,
    },
  },
  {
    id: "mint-ink",
    name: "Mint ink",
    style: {
      frontColor: "#dff7ea",
      backColor: "#143642",
      frontPattern: "dots",
      backPattern: "coordinate-grid",
      creaseColor: "#1f8a70",
      highlightColor: "#ffd166",
      opacity: 0.94,
      patternScale: 1.25,
      patternRotation: 15,
    },
  },
  {
    id: "coral-night",
    name: "Coral night",
    style: {
      frontColor: "#ffe1d6",
      backColor: "#1b1f3b",
      frontPattern: "washi-wave",
      backPattern: "high-contrast",
      creaseColor: "#ff8a5b",
      highlightColor: "#f9f871",
      opacity: 0.96,
      patternScale: 1.5,
      patternRotation: 30,
    },
  },
  {
    id: "blueprint-gold",
    name: "Blueprint gold",
    style: {
      frontColor: "#eef6ff",
      backColor: "#12355b",
      frontPattern: "coordinate-grid",
      backPattern: "diagonal-stripe",
      creaseColor: "#d8a31a",
      highlightColor: "#ffed99",
      opacity: 0.98,
      patternScale: 0.85,
      patternRotation: 345,
    },
  },
];

export const origamiPaperPaletteHasContrast = (
  palette: OrigamiFunctionPaperPalette,
) =>
  origamiPaperContrastRatio(
    palette.style.frontColor,
    palette.style.backColor,
  ) >= ORIGAMI_PAPER_PALETTE_MIN_CONTRAST;

export const randomOrigamiPaperPalette = (
  currentPaletteId: string,
  random = Math.random,
) => {
  const currentIndex = origamiFunctionPaperPalettes.findIndex(
    ({ id }) => id === currentPaletteId,
  );
  const startIndex = currentIndex >= 0 ? currentIndex : 0;
  const offset =
    origamiFunctionPaperPalettes.length <= 1
      ? 0
      : Math.floor(random() * (origamiFunctionPaperPalettes.length - 1)) + 1;
  return origamiFunctionPaperPalettes[
    (startIndex + offset) % origamiFunctionPaperPalettes.length
  ];
};
