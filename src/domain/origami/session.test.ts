import {
  appendSessionFold,
  emptyOrigamiSession,
  parseOrigamiSession,
  serializeOrigamiSession,
  sessionPosition,
  threeFoldReferenceSession,
} from "./session";
import type { GuidedFoldRequest } from "./guidedFold";

const request: GuidedFoldRequest = {
  operation: "point-to-point",
  title: "Bisect",
  movingSide: "left",
  source: { x: 0, y: 3 },
  target: { x: 10, y: 3 },
};

describe("origami sessions", () => {
  it("applies folds sequentially and retains face lineage", () => {
    const first = appendSessionFold(emptyOrigamiSession(), request);
    const second = appendSessionFold(first, {
      operation: "through-point",
      title: "Horizontal",
      movingSide: "right",
      through: { x: 5, y: 3 },
      angle: 0,
    });
    expect(second.steps).toHaveLength(2);
    expect(
      second.steps[1].document.objects.some(({ id }) => id.includes("face-1")),
    ).toBe(true);
    expect(second.steps[1].paperAfter.creases).toHaveLength(2);
  });

  it("maps global time exactly across step boundaries", () => {
    const session = appendSessionFold(
      appendSessionFold(emptyOrigamiSession(), request),
      { ...request, title: "Again", movingSide: "right" },
    );
    const boundary = session.steps[0].end;
    expect(sessionPosition(session, boundary)?.stepIndex).toBe(1);
    expect(sessionPosition(session, boundary)?.localTime).toBe(0);
  });

  it("round trips a versioned session", () => {
    const session = appendSessionFold(emptyOrigamiSession("Saved"), request);
    const restored = parseOrigamiSession(serializeOrigamiSession(session));
    expect(restored.title).toBe("Saved");
    expect(restored.steps).toHaveLength(1);
  });

  it("builds the three-fold reference", () => {
    const session = threeFoldReferenceSession();
    expect(session.steps).toHaveLength(3);
    expect(session.duration).toBeGreaterThan(0);
  });
});
