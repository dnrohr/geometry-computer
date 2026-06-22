import { act, renderHook } from "@testing-library/react";
import {
  activeStepAt,
  clamp,
  prefersReducedMotion,
  useScrollProgress,
} from "./useScrollProgress";

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

  it("converts container scroll position into progress", () => {
    const previous = globalThis.matchMedia;
    globalThis.matchMedia = (() => ({
      matches: false,
    })) as unknown as typeof matchMedia;
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 500,
    });
    const element = document.createElement("section");
    element.getBoundingClientRect = vi.fn(() => ({
      bottom: 750,
      height: 1000,
      left: 0,
      right: 100,
      top: -250,
      width: 100,
      x: 0,
      y: -250,
      toJSON: () => ({}),
    }));
    const onProgress = vi.fn();
    const { result } = renderHook(() => useScrollProgress(element, onProgress));
    expect(result.current).toBe(0.5);
    expect(onProgress).toHaveBeenLastCalledWith(0.5);
    act(() => window.dispatchEvent(new Event("scroll")));
    expect(onProgress).toHaveBeenCalledWith(0.5);
    globalThis.matchMedia = previous;
  });

  it("completes immediately for reduced motion", () => {
    const previous = globalThis.matchMedia;
    globalThis.matchMedia = (() => ({
      matches: true,
    })) as unknown as typeof matchMedia;
    const onProgress = vi.fn();
    const { result } = renderHook(() =>
      useScrollProgress(document.createElement("section"), onProgress),
    );
    expect(result.current).toBe(1);
    expect(onProgress).toHaveBeenCalledWith(1);
    globalThis.matchMedia = previous;
  });

  it("uses the latest callback without resetting progress when it changes", () => {
    const previous = globalThis.matchMedia;
    globalThis.matchMedia = (() => ({
      matches: false,
    })) as unknown as typeof matchMedia;
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 500,
    });
    const element = document.createElement("section");
    element.getBoundingClientRect = vi.fn(() => ({
      bottom: 750,
      height: 1000,
      left: 0,
      right: 100,
      top: -250,
      width: 100,
      x: 0,
      y: -250,
      toJSON: () => ({}),
    }));
    const first = vi.fn();
    const latest = vi.fn();
    const { rerender } = renderHook(
      ({ callback }) => useScrollProgress(element, callback),
      { initialProps: { callback: first } },
    );
    expect(first).toHaveBeenCalledWith(0.5);
    rerender({ callback: latest });
    expect(latest).not.toHaveBeenCalled();
    act(() => window.dispatchEvent(new Event("scroll")));
    expect(latest).toHaveBeenCalledWith(0.5);
    globalThis.matchMedia = previous;
  });
});
