import { validateRenderDocument } from "../render/validateRenderDocument";
import { compileFlatFoldDocument } from "./compileFold";
import {
  foldLineToLine,
  foldPointToLineThroughPoint,
  foldPointToPoint,
  foldThroughPoint,
  solveLineToLine,
  solvePointToLineThroughPoint,
} from "./folds";
import {
  clipPolygonToSide,
  linePolygonSegment,
  lineThrough,
  lineThroughPoints,
  polygonSignedArea,
  reflectPoint,
  signedDistanceToLine,
} from "./geometry";
import { applyFlatFold, rectangularPaper } from "./paper";

const closePoint = (
  actual: { x: number; y: number },
  expected: { x: number; y: number },
) => {
  expect(actual.x).toBeCloseTo(expected.x, 8);
  expect(actual.y).toBeCloseTo(expected.y, 8);
};

describe("origami geometry", () => {
  it("reflects points across an oriented line", () => {
    closePoint(
      reflectPoint(
        { x: -2, y: 3 },
        lineThrough({ x: 0, y: 0 }, { x: 0, y: 1 }),
      ),
      { x: 2, y: 3 },
    );
  });

  it("splits and clips a convex paper polygon", () => {
    const square = rectangularPaper(10, 10).faces[0].points;
    const crease = lineThrough({ x: 5, y: 0 }, { x: 0, y: 1 });
    const left = clipPolygonToSide(square, crease, "left");
    const right = clipPolygonToSide(square, crease, "right");
    expect(Math.abs(polygonSignedArea(left))).toBeCloseTo(50);
    expect(Math.abs(polygonSignedArea(right))).toBeCloseTo(50);
    expect(linePolygonSegment(crease, square)).toEqual([
      { x: 5, y: 0 },
      { x: 5, y: 10 },
    ]);
  });
});

describe("origami fold solvers", () => {
  it("maps one point exactly onto another", () => {
    const source = { x: 0, y: 2 };
    const target = { x: 8, y: 2 };
    const crease = foldPointToPoint(source, target);
    closePoint(reflectPoint(source, crease), target);
  });

  it("rejects the underdetermined coincident-point case", () => {
    expect(() => foldPointToPoint({ x: 1, y: 1 }, { x: 1, y: 1 })).toThrow(
      "do not determine one crease",
    );
  });

  it.each(["internal", "external"] as const)(
    "computes the %s angle-bisector branch",
    (branch) => {
      const horizontal = lineThroughPoints({ x: -1, y: 0 }, { x: 1, y: 0 });
      const vertical = lineThroughPoints({ x: 0, y: -1 }, { x: 0, y: 1 });
      const crease = foldLineToLine(horizontal, vertical, branch);
      const reflected = [
        reflectPoint({ x: 1, y: 0 }, crease),
        reflectPoint({ x: 2, y: 0 }, crease),
      ];
      reflected.forEach((point) =>
        expect(Math.abs(signedDistanceToLine(point, vertical))).toBeLessThan(
          1e-8,
        ),
      );
    },
  );

  it("bisects parallel lines", () => {
    const first = lineThrough({ x: 0, y: 0 }, { x: 1, y: 0 });
    const second = lineThrough({ x: 0, y: 4 }, { x: -1, y: 0 });
    const crease = foldLineToLine(first, second, "internal");
    expect(Math.abs(signedDistanceToLine({ x: 0, y: 2 }, crease))).toBeLessThan(
      1e-8,
    );
  });

  it("creates a crease through an explicitly constrained point", () => {
    const crease = foldThroughPoint({ x: 2, y: 3 }, { x: 1, y: 2 });
    expect(signedDistanceToLine({ x: 2, y: 3 }, crease)).toBeCloseTo(0);
  });

  it("solves both real point-to-line-through-point branches", () => {
    const source = { x: 0, y: 0 };
    const target = lineThrough({ x: -5, y: 3 }, { x: 1, y: 0 });
    const through = { x: 4, y: 0 };
    const creases = foldPointToLineThroughPoint(source, target, through);
    expect(creases).toHaveLength(2);
    creases.forEach((crease) => {
      expect(Math.abs(signedDistanceToLine(through, crease))).toBeLessThan(
        1e-7,
      );
      expect(
        Math.abs(signedDistanceToLine(reflectPoint(source, crease), target)),
      ).toBeLessThan(1e-7);
    });
  });

  it("reports point-to-line constraints with no real solution", () => {
    expect(() =>
      foldPointToLineThroughPoint(
        { x: 0, y: 0 },
        lineThrough({ x: 0, y: 10 }, { x: 1, y: 0 }),
        { x: 1, y: 0 },
      ),
    ).toThrow("No real crease");
  });

  it("retains symbolic descriptions, assumptions, and branch provenance", () => {
    const horizontal = lineThrough({ x: 0, y: 0 }, { x: 1, y: 0 });
    const vertical = lineThrough({ x: 0, y: 0 }, { x: 0, y: 1 });
    const lineSolution = solveLineToLine(horizontal, vertical, "external");
    expect(lineSolution.branch).toBe("external");
    expect(lineSolution.description).toContain("External");
    expect(lineSolution.assumptions).not.toHaveLength(0);
    const pointSolution = solvePointToLineThroughPoint(
      { x: 0, y: 0 },
      lineThrough({ x: 0, y: 3 }, { x: 1, y: 0 }),
      { x: 4, y: 0 },
    );
    expect(pointSolution.creases).toHaveLength(2);
    expect(pointSolution.description).toContain("circle");
  });

  it("rejects coincident lines as underdetermined", () => {
    const line = lineThrough({ x: 0, y: 0 }, { x: 1, y: 0 });
    expect(() => foldLineToLine(line, line, "internal")).toThrow(
      "do not determine one crease",
    );
  });
});

describe("flat paper state", () => {
  const paper = rectangularPaper(10, 6);
  const crease = foldPointToPoint({ x: 0, y: 3 }, { x: 10, y: 3 });
  const result = applyFlatFold(paper, crease, "left");

  it("splits, reflects, flips, and layers the moving face", () => {
    expect(result.stationaryFaces).toHaveLength(1);
    expect(result.movingFaces).toHaveLength(1);
    expect(
      Math.abs(polygonSignedArea(result.movingFaces[0].source.points)),
    ).toBeCloseTo(30);
    expect(
      Math.abs(polygonSignedArea(result.movingFaces[0].target.points)),
    ).toBeCloseTo(30);
    expect(result.movingFaces[0].target.layer).toBe(1);
    expect(result.movingFaces[0].target.side).toBe("back");
    expect(result.after.creases).toHaveLength(1);
  });

  it("compiles computed targets into a valid v2 render document", () => {
    const document = compileFlatFoldDocument(
      result,
      "Fold left edge to right edge",
    );
    expect(() => validateRenderDocument(document)).not.toThrow();
    const fold = document.revealActions.find(
      ({ animation }) => animation === "fold",
    );
    expect(fold?.animation).toBe("fold");
    if (fold?.animation === "fold")
      expect(fold.targetPoints).toEqual(result.movingFaces[0].target.points);
  });

  it("emits material, layer, annotation, pause, and unfold presentation data", () => {
    const document = compileFlatFoldDocument(result, "Reversible fold", {
      sourcePoint: { x: 0, y: 3 },
      targetPoint: { x: 10, y: 3 },
      targetLine: lineThrough({ x: 0, y: 2 }, { x: 1, y: 0 }),
      pauseBefore: 0.5,
      pauseAfter: 0.25,
      unfold: true,
    });
    expect(() => validateRenderDocument(document)).not.toThrow();
    expect(document.objects.some(({ kind }) => kind === "arrow")).toBe(true);
    expect(document.objects.some(({ id }) => id === "fold-target-line")).toBe(
      true,
    );
    const fold = document.revealActions.find(
      ({ animation }) => animation === "fold",
    );
    const unfold = document.revealActions.find(
      ({ animation }) => animation === "unfold",
    );
    expect(fold?.start).toBeCloseTo(1.1);
    expect(fold).toMatchObject({ targetLayer: 1, targetSide: "back" });
    expect(unfold).toMatchObject({ targetLayer: 0, targetSide: "front" });
    expect(document.metadata.duration).toBe(unfold?.end);
  });
});
