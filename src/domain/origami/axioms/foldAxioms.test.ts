import {
  OrigamiAxiomError,
  foldLineToLine,
  foldPointToLine,
  foldPointToPoint,
  reflectPointAcrossLine,
} from "./foldAxioms";

const expectPointClose = (
  actual: { x: number; y: number },
  expected: { x: number; y: number },
) => {
  expect(actual.x).toBeCloseTo(expected.x);
  expect(actual.y).toBeCloseTo(expected.y);
};

describe("origami fold axiom templates", () => {
  it("folds one point onto another with a perpendicular-bisector crease", () => {
    const [solution] = foldPointToPoint({ x: 3, y: 5 }, { x: 7, y: 5 });

    expect(solution).toMatchObject({
      id: "point-to-point-1",
      axiom: "point-to-point",
      reflectedPoints: [{ x: 7, y: 5 }],
    });
    expectPointClose(solution.crease.point, { x: 5, y: 5 });
    expectPointClose(solution.crease.direction, { x: 0, y: 1 });
    expectPointClose(reflectPointAcrossLine({ x: 3, y: 5 }, solution.crease), {
      x: 7,
      y: 5,
    });
  });

  it("rejects point-to-point folds for coincident points", () => {
    expect(() => foldPointToPoint({ x: 1, y: 1 }, { x: 1, y: 1 })).toThrow(
      OrigamiAxiomError,
    );
    try {
      foldPointToPoint({ x: 1, y: 1 }, { x: 1, y: 1 });
    } catch (reason) {
      expect(reason).toMatchObject({
        code: "COINCIDENT_POINTS",
        degeneracies: [{ kind: "coincident-points" }],
      });
    }
  });

  it("chooses a deterministic point-to-line fold by projecting to the target line", () => {
    const [solution] = foldPointToLine(
      { x: 2, y: 4 },
      { point: { x: 0, y: 0 }, direction: { x: 1, y: 0 } },
    );

    expect(solution).toMatchObject({
      id: "point-to-line-1",
      axiom: "point-to-line",
      reflectedPoints: [{ x: 2, y: 0 }],
    });
    expectPointClose(solution.crease.point, { x: 2, y: 2 });
    expectPointClose(solution.crease.direction, { x: 1, y: 0 });
  });

  it("reports ambiguous point-to-line folds when the point is already on the line", () => {
    expect(() =>
      foldPointToLine(
        { x: 2, y: 0 },
        { point: { x: 0, y: 0 }, direction: { x: 1, y: 0 } },
      ),
    ).toThrow(/infinitely many folds/i);
  });

  it("returns sorted angle-bisector solutions for intersecting lines", () => {
    const solutions = foldLineToLine(
      { point: { x: 0, y: 0 }, direction: { x: 1, y: 0 } },
      { point: { x: 0, y: 0 }, direction: { x: 0, y: 1 } },
    );

    expect(solutions.map(({ id }) => id)).toEqual([
      "line-to-line-2",
      "line-to-line-1",
    ]);
    expectPointClose(solutions[0].crease.point, { x: 0, y: 0 });
    expectPointClose(solutions[0].crease.direction, {
      x: Math.SQRT1_2,
      y: -Math.SQRT1_2,
    });
    expectPointClose(solutions[1].crease.direction, {
      x: Math.SQRT1_2,
      y: Math.SQRT1_2,
    });
  });

  it("folds parallel lines along their midline and records the branch", () => {
    const [solution] = foldLineToLine(
      { point: { x: 0, y: 0 }, direction: { x: 1, y: 0 } },
      { point: { x: 0, y: 2 }, direction: { x: 1, y: 0 } },
    );

    expect(solution).toMatchObject({
      id: "line-to-line-parallel-1",
      axiom: "line-to-line",
      degeneracies: [{ kind: "parallel-lines" }],
    });
    expectPointClose(solution.crease.point, { x: 0, y: 1 });
    expectPointClose(solution.crease.direction, { x: 1, y: 0 });
  });

  it("reports ambiguous line-to-line folds for coincident lines", () => {
    expect(() =>
      foldLineToLine(
        { point: { x: 0, y: 0 }, direction: { x: 1, y: 0 } },
        { point: { x: 2, y: 0 }, direction: { x: 1, y: 0 } },
      ),
    ).toThrow(/Coincident lines/i);
  });

  it("rejects zero direction vectors before returning solutions", () => {
    expect(() =>
      foldPointToLine(
        { x: 1, y: 1 },
        { point: { x: 0, y: 0 }, direction: { x: 0, y: 0 } },
      ),
    ).toThrow(/zero direction vector/i);
  });
});
