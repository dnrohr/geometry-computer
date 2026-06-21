import { activeStepAt, clamp, prefersReducedMotion } from "./useScrollProgress";

describe("scroll progress utilities", () => {
  it("clamps progress and selects threshold steps", () => {
    expect(clamp(-1)).toBe(0);
    expect(clamp(2)).toBe(1);
    expect(activeStepAt(0, 4)).toBe(0);
    expect(activeStepAt(0.51, 4)).toBe(2);
    expect(activeStepAt(1, 4)).toBe(3);
  });

  it("reads reduced-motion preference", () => {
    const previous = globalThis.matchMedia;
    globalThis.matchMedia = (() => ({
      matches: true,
    })) as unknown as typeof matchMedia;
    expect(prefersReducedMotion()).toBe(true);
    globalThis.matchMedia = previous;
  });
});
