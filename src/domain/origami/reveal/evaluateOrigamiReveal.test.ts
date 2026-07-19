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

  it("keeps future dim objects visible until their real reveal action takes over", () => {
    const actions: OrigamiRevealAction[] = [
      {
        id: "future",
        stepId: "fold",
        objectId: "guide",
        start: 0,
        end: 0.5,
        animation: "dim",
      },
      {
        id: "draw",
        stepId: "fold",
        objectId: "guide",
        start: 0.5,
        end: 1,
        animation: "draw",
      },
    ];

    expect(evaluateOrigamiReveal(actions, 0.25).guide).toMatchObject({
      visible: true,
      opacity: 0.12,
      future: true,
    });
    expect(evaluateOrigamiReveal(actions, 0.75).guide).toMatchObject({
      visible: true,
      drawProgress: 0.5,
      future: false,
    });
  });
});
