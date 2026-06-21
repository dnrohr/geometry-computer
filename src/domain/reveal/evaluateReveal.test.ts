import { evaluateReveal } from "./evaluateReveal";
import type { RevealAction } from "../construction/types";

const action = (animation: RevealAction["animation"]): RevealAction => ({
  id: animation,
  stepId: "step",
  objectId: "object",
  start: 0.25,
  end: 0.75,
  animation,
});

describe("evaluateReveal", () => {
  it("hides, partially draws, and completes an object", () => {
    expect(evaluateReveal([action("draw")], 0).object.visible).toBe(false);
    expect(evaluateReveal([action("draw")], 0.5).object.drawProgress).toBe(0.5);
    expect(evaluateReveal([action("draw")], 1).object.drawProgress).toBe(1);
  });

  it("evaluates fade-out and dim actions deterministically", () => {
    expect(evaluateReveal([action("fade-out")], 0.5).object.opacity).toBe(0.5);
    expect(evaluateReveal([action("fade-out")], 1).object.visible).toBe(false);
    expect(evaluateReveal([action("dim")], 0.5).object.dimmed).toBe(true);
  });
});
