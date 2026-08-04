import { compileOrigamiExample, origamiExamples } from "./examples";
import { adjacentBoundary, clampTime, evaluateOrigamiTimeline, timelineBoundaries } from "./timeline";

describe("origami timeline", () => {
  const document = compileOrigamiExample(origamiExamples[0]);
  const fold = document.revealActions.find(({ animation }) => animation === "fold")!;
  const source = document.objects.find(({ id }) => id === fold.objectId)!;

  it("clamps time and exposes sorted action boundaries", () => {
    expect(clampTime(-2, 5)).toBe(0);
    expect(clampTime(8, 5)).toBe(5);
    const boundaries = timelineBoundaries(document);
    expect(boundaries[0]).toBe(0);
    expect(boundaries.at(-1)).toBe(document.metadata.duration);
    expect(boundaries).toEqual([...boundaries].sort((a, b) => a - b));
  });

  it("navigates to strictly adjacent boundaries", () => {
    expect(adjacentBoundary(document, 0, 1)).toBeGreaterThan(0);
    expect(adjacentBoundary(document, document.metadata.duration, -1)).toBeLessThan(document.metadata.duration);
  });

  it("interpolates a fold without changing source geometry", () => {
    if (source.data.kind !== "polygon" || !("targetPoints" in fold)) throw new Error("expected polygon fold");
    const halfway = evaluateOrigamiTimeline(document, (fold.start + fold.end) / 2)[source.id];
    expect(halfway.folding).toBe(true);
    expect(halfway.points?.[0].x).toBeCloseTo((source.data.points[0].x + fold.targetPoints[0].x) / 2);
    expect(source.data.points).not.toBe(fold.targetPoints);
  });

  it("lands exactly on computed target geometry", () => {
    if (!("targetPoints" in fold)) throw new Error("expected fold");
    expect(evaluateOrigamiTimeline(document, fold.end)[fold.objectId].points).toEqual(fold.targetPoints);
  });

  it("handles zero-duration actions deterministically", () => {
    const copy = structuredClone(document);
    copy.revealActions[0].start = 0.5;
    copy.revealActions[0].end = 0.5;
    expect(evaluateOrigamiTimeline(copy, 0.49)[copy.revealActions[0].objectId].opacity).toBe(0);
    expect(evaluateOrigamiTimeline(copy, 0.5)[copy.revealActions[0].objectId].opacity).toBe(1);
  });
});
