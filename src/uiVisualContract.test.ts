import { readFileSync } from "node:fs";

const appCss = readFileSync("src/App.css", "utf8");

describe("visual contract UI-012–014, UI-032, UI-065–073, UI-084, UI-121, UI-123–124", () => {
  it("uses responsive desktop/mobile grids without clipping the construction", () => {
    expect(appCss).toMatch(
      /\.construction-layout\s*{[^}]*grid-template-columns:/s,
    );
    expect(appCss).toMatch(
      /\.construction-layout\s*{[^}]*overflow:\s*visible/s,
    );
    expect(appCss).toMatch(/@media\s*\(max-width:\s*760px\)/);
    expect(appCss).toMatch(
      /@media[^]*\.construction-layout,[^]*grid-template-columns:\s*1fr/,
    );
    expect(appCss).toMatch(/\.gallery\s*>\s*div\s*{[^}]*overflow-x:\s*auto/s);
  });

  it("keeps the canvas sticky and gives steps room to grow", () => {
    expect(appCss).toMatch(/\.canvas-panel\s*{[^}]*position:\s*sticky/s);
    expect(appCss).toMatch(/\.canvas-panel\s*{[^}]*top:\s*1rem/s);
    expect(appCss).toMatch(/\.steps-panel\s+li\s*{[^}]*min-height:\s*12rem/s);
  });

  it.each([
    ["input", "#8dc5d6"],
    ["unit", "#d8d8d0"],
    ["intermediate", "#ad91d3"],
    ["active-construction", "#e7d28c"],
  ])("defines the %s geometry role", (role, color) => {
    expect(appCss).toContain(`.geometry-${role}`);
    expect(appCss).toContain(color);
  });

  it("distinguishes scaffold, result, and highlighted geometry without color alone", () => {
    expect(appCss).toMatch(/\.geometry-scaffold\s*{[^}]*stroke-dasharray:/s);
    expect(appCss).toMatch(/\.geometry-result\s*{[^}]*stroke-width:\s*4/s);
    expect(appCss).toMatch(
      /\.is-highlighted\s+\.geometry-object\s*{[^}]*stroke-width:\s*5/s,
    );
    expect(appCss).toMatch(/\.steps-panel\s+li\.active\s*{[^}]*border-left:/s);
  });

  it("provides visible focus and reduced-motion overrides", () => {
    expect(appCss).toMatch(/button:focus-visible,[^]*outline:\s*3px\s+solid/s);
    expect(appCss).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    expect(appCss).toMatch(/scroll-behavior:\s*auto\s*!important/);
    expect(appCss).toMatch(/animation:\s*none\s*!important/);
  });
});
