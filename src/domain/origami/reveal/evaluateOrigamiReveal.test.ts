import type { OrigamiRevealAction } from "../types";
import {
  clampOrigamiProgress,
  evaluateOrigamiReveal,
} from "./evaluateOrigamiReveal";

const action = (
  animation: OrigamiRevealAction["animation"],
): OrigamiRevealAction => ({
  id: animation,
  stepId: "fold",
  objectId: "crease",
  start: 0.25,
  end: 0.75,
  animation,
});

describe("evaluateOrigamiReveal", () => {
  it("clamps progress and partially draws crease objects", () => {
    expect(clampOrigamiProgress(-1)).toBe(0);
    expect(clampOrigamiProgress(2)).toBe(1);
    expect(evaluateOrigamiReveal([action("draw")], 0).crease.visible).toBe(
      false,
    );
    expect(
      evaluateOrigamiReveal([action("draw")], 0.5).crease.drawProgress,
    ).toBe(0.5);
    expect(evaluateOrigamiReveal([action("draw")], 1).crease.drawProgress).toBe(
      1,
    );
  });

  it("evaluates fade, highlight, and dim actions deterministically", () => {
    expect(
      evaluateOrigamiReveal([action("fade-out")], 0.5).crease.opacity,
    ).toBe(0.5);
    expect(
      evaluateOrigamiReveal([action("highlight")], 0.5).crease.highlighted,
    ).toBe(true);
    expect(evaluateOrigamiReveal([action("dim")], 0.5).crease.dimmed).toBe(
      true,
    );
  });
});
