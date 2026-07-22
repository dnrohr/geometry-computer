import { compiledAdvancedOrigamiArithmeticFixtures } from "./arithmeticGallery";
import { parseExpression } from "../../parser/parseExpression";
import { foldLineToLine, foldPointToLine, foldPointToPoint } from "../axioms";
import {
  OrigamiCompilerError,
  compileOrigamiExpression,
} from "../compiler/compileOrigamiExpression";

describe("advanced origami arithmetic fixtures", () => {
  it("ships deterministic geometry fixtures for advanced arithmetic macros", () => {
    const fixtures = compiledAdvancedOrigamiArithmeticFixtures();

    expect(fixtures.map(({ title, operation }) => [title, operation])).toEqual([
      ["Multiplication geometry fixture", "mul"],
      ["Division geometry fixture", "div"],
      ["Square geometry fixture", "square"],
      ["Square-root geometry fixture", "sqrt"],
    ]);
    expect(fixtures).toEqual(compiledAdvancedOrigamiArithmeticFixtures());
  });

  it("exposes intermediate geometry needed by renderer and inspector consumers", () => {
    for (const {
      operation,
      scene,
    } of compiledAdvancedOrigamiArithmeticFixtures()) {
      const step = scene.steps.find((item) => item.operation === operation);
      const trace = step?.macroTrace;
      const proof = scene.proofs.find(({ id }) => id === step?.proofId);

      expect(trace).toBeDefined();
      expect(trace?.unitReferenceObjectIds.length).toBeGreaterThan(0);
      expect(trace?.guideLineObjectIds.length).toBeGreaterThan(0);
      expect(trace?.foldCreaseObjectIds.length).toBeGreaterThan(1);
      expect(trace?.selectedIntersectionObjectIds.length).toBeGreaterThan(0);
      expect(trace?.resultSegmentObjectIds.length).toBe(1);
      expect(trace?.branchSelections).toEqual([
        expect.objectContaining({ selected: true }),
      ]);
      expect(proof?.claims.map(({ id }) => id)).toEqual(
        expect.arrayContaining(trace?.proofClaimIds ?? []),
      );

      const exposedIds = new Set([
        ...(trace?.unitReferenceObjectIds ?? []),
        ...(trace?.guideLineObjectIds ?? []),
        ...(trace?.foldCreaseObjectIds ?? []),
        ...(trace?.selectedIntersectionObjectIds ?? []),
        ...(trace?.resultSegmentObjectIds ?? []),
      ]);
      for (const objectId of exposedIds) {
        expect(scene.objects.some(({ id }) => id === objectId)).toBe(true);
        expect(step?.createdObjectIds).toContain(objectId);
      }
    }
  });

  it("pins numeric results, intermediate counts, provenance, and branch choices", () => {
    const expectations = [
      {
        operation: "mul",
        value: 6,
        objectCount: 24,
        stepCount: 3,
        branchId: "mul-intercept-similar-triangle",
        resultExpression: "a * b",
        traceCounts: {
          unit: 1,
          guides: 2,
          creases: 3,
          intersections: 1,
          results: 1,
        },
      },
      {
        operation: "div",
        value: 3,
        objectCount: 25,
        stepCount: 3,
        branchId: "div-reciprocal-intercept",
        resultExpression: "a / b",
        traceCounts: {
          unit: 1,
          guides: 2,
          creases: 3,
          intersections: 2,
          results: 1,
        },
      },
      {
        operation: "square",
        value: 9,
        objectCount: 24,
        stepCount: 3,
        branchId: "square-multiplication-specialization",
        resultExpression: "a^2",
        traceCounts: {
          unit: 1,
          guides: 2,
          creases: 3,
          intersections: 1,
          results: 1,
        },
      },
      {
        operation: "sqrt",
        value: 2,
        objectCount: 19,
        stepCount: 2,
        branchId: "sqrt-geometric-mean",
        resultExpression: "sqrt(a)",
        traceCounts: {
          unit: 1,
          guides: 2,
          creases: 3,
          intersections: 1,
          results: 1,
        },
      },
    ];

    for (const expected of expectations) {
      const fixture = compiledAdvancedOrigamiArithmeticFixtures().find(
        ({ operation }) => operation === expected.operation,
      );
      const step = fixture?.scene.steps.find(
        ({ operation }) => operation === expected.operation,
      );
      const trace = step?.macroTrace;
      const resultId = trace?.resultSegmentObjectIds[0];
      const result = fixture?.scene.objects.find(({ id }) => id === resultId);

      expect(fixture?.scene.value).toBe(expected.value);
      expect(fixture?.scene.objects).toHaveLength(expected.objectCount);
      expect(fixture?.scene.steps).toHaveLength(expected.stepCount);
      expect(trace?.unitReferenceObjectIds).toHaveLength(
        expected.traceCounts.unit,
      );
      expect(trace?.guideLineObjectIds).toHaveLength(
        expected.traceCounts.guides,
      );
      expect(trace?.foldCreaseObjectIds).toHaveLength(
        expected.traceCounts.creases,
      );
      expect(trace?.selectedIntersectionObjectIds).toHaveLength(
        expected.traceCounts.intersections,
      );
      expect(trace?.resultSegmentObjectIds).toHaveLength(
        expected.traceCounts.results,
      );
      expect(trace?.branchSelections).toEqual([
        expect.objectContaining({
          id: expected.branchId,
          selected: true,
          reason: expect.any(String),
        }),
      ]);
      expect(result).toMatchObject({
        kind: "segment",
        role: "result",
        provenance: {
          expression: expected.resultExpression,
          sourceObjectIds: expect.arrayContaining(
            trace?.sourceSegmentObjectIds ?? [],
          ),
        },
      });
    }
  });

  it("reports readable advanced arithmetic degeneracy errors", () => {
    expect(() =>
      compileOrigamiExpression(parseExpression("a/b"), { a: 3, b: 0 }),
    ).toThrow(
      new OrigamiCompilerError(
        "Division by zero has no flat-origami length trace.",
        "DIVISION_BY_ZERO",
      ),
    );
    expect(() =>
      compileOrigamiExpression(parseExpression("sqrt(a)"), { a: -1 }),
    ).toThrow(
      new OrigamiCompilerError(
        "A negative length has no real flat-origami square-root trace.",
        "NEGATIVE_SQUARE_ROOT",
      ),
    );
    expect(() =>
      compileOrigamiExpression(parseExpression("a"), {
        a: Number.POSITIVE_INFINITY,
      }),
    ).toThrow(
      new OrigamiCompilerError(
        "Sample a must be a finite real length for the flat-origami trace.",
        "NO_REAL_SOLUTION",
      ),
    );
    expect(() =>
      compileOrigamiExpression(parseExpression("a*b"), { a: 6, b: 6 }),
    ).toThrow(
      new OrigamiCompilerError(
        "Expression a * b is too large to display on the current origami paper scale.",
        "FOLD_OUTSIDE_PAPER",
      ),
    );
    expect(() => foldPointToPoint({ x: 0, y: 0 }, { x: 0, y: 0 })).toThrow(
      /coincident/i,
    );
    expect(() =>
      foldPointToLine(
        { x: 1, y: 0 },
        {
          point: { x: 0, y: 0 },
          direction: { x: 1, y: 0 },
        },
      ),
    ).toThrow(/infinitely many folds/i);
    expect(() =>
      foldLineToLine(
        { point: { x: 0, y: 0 }, direction: { x: 1, y: 0 } },
        { point: { x: 2, y: 0 }, direction: { x: 2, y: 0 } },
      ),
    ).toThrow(/coincident/i);
  });
});
