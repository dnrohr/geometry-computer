import { distance, midpoint, nearlyEqual, toViewport } from "./coordinates";
import { circleObject, lineObject, pointObject, segmentObject } from "./types";

const metadata = {
  id: "object-1",
  role: "input" as const,
  createdByStepId: "step-1",
  usedByStepIds: [],
  dependsOnObjectIds: [],
};

describe("geometry object model", () => {
  it("creates typed objects with required provenance", () => {
    expect(pointObject({ x: 1, y: 2 }, metadata)).toMatchObject({
      kind: "point",
      createdByStepId: "step-1",
    });
    expect(segmentObject({ x: 0, y: 0 }, { x: 2, y: 0 }, metadata).kind).toBe(
      "segment",
    );
    expect(lineObject({ x: 0, y: 0 }, { x: 1, y: 1 }, metadata).kind).toBe(
      "line",
    );
    expect(circleObject({ x: 0, y: 0 }, 2, metadata).kind).toBe("circle");
  });

  it("provides deterministic coordinate helpers", () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    expect(midpoint({ x: 0, y: 2 }, { x: 4, y: 6 })).toEqual({ x: 2, y: 4 });
    expect(
      toViewport(
        { x: 5, y: 5 },
        { x: 0, y: 0, width: 10, height: 10 },
        { x: 0, y: 0, width: 100, height: 50 },
      ),
    ).toEqual({ x: 50, y: 25 });
    expect(nearlyEqual(0.1 + 0.2, 0.3)).toBe(true);
  });
});
