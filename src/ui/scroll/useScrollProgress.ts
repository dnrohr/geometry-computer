import { useEffect, useState } from "react";

export const clamp = (value: number) => Math.max(0, Math.min(1, value));
export const activeStepAt = (progress: number, count: number) =>
  Math.min(Math.max(0, count - 1), Math.floor(clamp(progress) * count));
export const prefersReducedMotion = () =>
  typeof matchMedia !== "undefined" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;
export function useScrollProgress(
  element: HTMLElement | null,
  onProgress?: (progress: number) => void,
) {
  const [progress, setProgress] = useState(prefersReducedMotion() ? 1 : 0);
  useEffect(() => {
    if (!element) return;
    if (prefersReducedMotion()) {
      onProgress?.(1);
      return;
    }
    const update = () => {
      const rect = element.getBoundingClientRect();
      const distance = Math.max(1, rect.height - innerHeight);
      const next = clamp(-rect.top / distance);
      setProgress(next);
      onProgress?.(next);
    };
    update();
    addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
    return () => {
      removeEventListener("scroll", update);
      removeEventListener("resize", update);
    };
  }, [element, onProgress]);
  return progress;
}
