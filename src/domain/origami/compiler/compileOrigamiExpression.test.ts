import { readFileSync } from "node:fs";
import { parseExpression } from "../../parser/parseExpression";
import { compiledOrigamiArithmeticExamples } from "../examples";
import {
  OrigamiCompilerError,
  compileOrigamiExpression,
} from "./compileOrigamiExpression";

describe("origami expression compiler", () => {
  it("compiles parsed variables and constants into isolated origami scenes", () => {
    const variableScene = compileOrigamiExpression(
      parseExpression("a"),
      { a: 3 },
      "a",
    );
    const constantScene = compileOrigamiExpression(
      parseExpression("2"),
      {},
      "2",
    );

    expect(variableScene).toMatchObject({
      title: "Compiled origami trace",
      expression: "a",
      value: 3,
      steps: [{ operation: "place-input" }],
    });
    expect(constantScene).toMatchObject({
      expression: "2",
      value: 2,
      steps: [{ operation: "constant" }],
    });
  });

  it("compiles addition and subtraction into origami-only arithmetic traces", () => {
    const addScene = compileOrigamiExpression(
      parseExpression("a+b"),
      { a: 3, b: 2 },
      "a+b",
    );
    const subScene = compileOrigamiExpression(
      parseExpression("a-b"),
      { a: 3, b: 2 },
      "a-b",
    );

    expect(addScene.value).toBe(5);
    expect(addScene.steps.map(({ operation }) => operation)).toEqual([
      "place-input",
      "place-input",
      "add",
    ]);
    expect(addScene.revealActions.length).toBeGreaterThan(
      addScene.steps.length,
    );
    expect(addScene.revealActions[0]).toMatchObject({
      stepId: addScene.steps[0].id,
      animation: "fade-in",
    });
    expect(
      addScene.objects.find(({ role }) => role === "result"),
    ).toMatchObject({
      kind: "segment",
      provenance: { expression: "a + b" },
    });
    expect(subScene.value).toBe(1);
    expect(subScene.steps.map(({ operation }) => operation)).toEqual([
      "place-input",
      "place-input",
      "sub",
    ]);
  });

  it("emits copy-length traces when an expression value is reused", () => {
    const scene = compileOrigamiExpression(
      parseExpression("a+a"),
      { a: 3 },
      "a+a",
    );

    expect(scene.value).toBe(6);
    expect(scene.steps.map(({ operation }) => operation)).toEqual([
      "place-input",
      "copy-length",
      "add",
    ]);
    expect(scene.steps[1]).toMatchObject({
      operation: "copy-length",
      inputObjectIds: ["origami-segment-1"],
      outputObjectIds: ["origami-segment-2"],
    });
  });

  it("compiles multiplication, division, square, and square root traces", () => {
    const cases: {
      expression: string;
      values: Record<string, number>;
      value: number;
      operations: string[];
    }[] = [
      {
        expression: "a*b",
        values: { a: 3, b: 2 },
        value: 6,
        operations: ["place-input", "place-input", "mul"],
      },
      {
        expression: "a/b",
        values: { a: 6, b: 2 },
        value: 3,
        operations: ["place-input", "place-input", "div"],
      },
      {
        expression: "a^2",
        values: { a: 3 },
        value: 9,
        operations: ["place-input", "copy-length", "square"],
      },
      {
        expression: "sqrt(a)",
        values: { a: 4 },
        value: 2,
        operations: ["place-input", "sqrt"],
      },
    ];

    for (const item of cases) {
      const scene = compileOrigamiExpression(
        parseExpression(item.expression),
        item.values,
        item.expression,
      );
      expect(scene.value).toBe(item.value);
      expect(scene.steps.map(({ operation }) => operation)).toEqual(
        item.operations,
      );
      expect(
        scene.objects.filter(({ kind }) => kind === "crease").length,
      ).toBeGreaterThanOrEqual(scene.steps.length);
      expect(scene.objects.find(({ role }) => role === "result")).toMatchObject(
        {
          kind: "segment",
          provenance: { expression: expect.any(String) },
        },
      );
    }
  });

  it("records the N1 arithmetic macro trace contract on compiled steps", () => {
    const scene = compileOrigamiExpression(
      parseExpression("a*b"),
      { a: 3, b: 2 },
      "a*b",
    );
    const multiplyStep = scene.steps.find(
      ({ operation }) => operation === "mul",
    );

    expect(multiplyStep?.macroTrace).toMatchObject({
      macroId: multiplyStep?.id,
      operation: "mul",
      sourceSegmentObjectIds: ["origami-segment-1", "origami-segment-2"],
      unitReferenceObjectIds: ["origami-unit-segment-1"],
      guideLineObjectIds: ["origami-guide-line-1", "origami-guide-line-2"],
      foldCreaseObjectIds: [
        "origami-crease-3",
        "origami-crease-4",
        "origami-crease-5",
      ],
      reflectedObjectIds: [],
      selectedIntersectionObjectIds: ["origami-intersection-1"],
      resultSegmentObjectIds: ["origami-segment-3"],
      proofClaimIds: ["origami-claim-mul"],
      branchSelections: [
        {
          id: "mul-intercept-similar-triangle",
          label: "Intercept similar-triangle branch",
          selected: true,
        },
      ],
      degeneracyObjectIds: [],
    });
  });

  it("expands multiplication with visible intercept construction geometry", () => {
    const scene = compileOrigamiExpression(
      parseExpression("a*b"),
      { a: 3, b: 2 },
      "a*b",
    );
    const multiplyStep = scene.steps.find(
      ({ operation }) => operation === "mul",
    );
    const createdObjects = new Set(multiplyStep?.createdObjectIds);

    expect(multiplyStep?.macroTrace?.unitReferenceObjectIds).toHaveLength(1);
    expect(multiplyStep?.macroTrace?.guideLineObjectIds).toHaveLength(2);
    expect(multiplyStep?.macroTrace?.foldCreaseObjectIds).toHaveLength(3);
    expect(
      multiplyStep?.macroTrace?.selectedIntersectionObjectIds,
    ).toHaveLength(1);
    expect(
      scene.objects
        .filter(({ id }) => createdObjects.has(id))
        .map(({ id }) => id),
    ).toEqual(
      expect.arrayContaining([
        "origami-unit-segment-1",
        "origami-input-copy-1",
        "origami-input-copy-2",
        "origami-guide-line-1",
        "origami-guide-line-2",
        "origami-intersection-1",
        "origami-crease-4",
        "origami-crease-5",
      ]),
    );
  });

  it("expands division with visible reciprocal construction geometry", () => {
    const scene = compileOrigamiExpression(
      parseExpression("a/b"),
      { a: 6, b: 2 },
      "a/b",
    );
    const divisionStep = scene.steps.find(
      ({ operation }) => operation === "div",
    );
    const createdObjects = new Set(divisionStep?.createdObjectIds);

    expect(divisionStep?.macroTrace).toMatchObject({
      operation: "div",
      sourceSegmentObjectIds: ["origami-segment-1", "origami-segment-2"],
      unitReferenceObjectIds: ["origami-unit-segment-1"],
      guideLineObjectIds: ["origami-guide-line-1", "origami-guide-line-2"],
      foldCreaseObjectIds: [
        "origami-crease-3",
        "origami-crease-4",
        "origami-crease-5",
      ],
      selectedIntersectionObjectIds: [
        "origami-intersection-1",
        "origami-intersection-2",
      ],
      resultSegmentObjectIds: ["origami-segment-3"],
      proofClaimIds: ["origami-claim-div"],
      branchSelections: [
        {
          id: "div-reciprocal-intercept",
          label: "Reciprocal intercept branch",
          selected: true,
        },
      ],
    });
    expect(
      scene.objects
        .filter(({ id }) => createdObjects.has(id))
        .map(({ id }) => id),
    ).toEqual(
      expect.arrayContaining([
        "origami-unit-segment-1",
        "origami-input-copy-1",
        "origami-input-copy-2",
        "origami-guide-line-1",
        "origami-guide-line-2",
        "origami-intersection-1",
        "origami-intersection-2",
        "origami-crease-4",
        "origami-crease-5",
      ]),
    );
  });

  it("expands square as a multiplication specialization with copied input provenance", () => {
    const scene = compileOrigamiExpression(
      parseExpression("a^2"),
      { a: 3 },
      "a^2",
    );
    const squareStep = scene.steps.find(
      ({ operation }) => operation === "square",
    );

    expect(scene.steps.map(({ operation }) => operation)).toEqual([
      "place-input",
      "copy-length",
      "square",
    ]);
    expect(squareStep?.macroTrace).toMatchObject({
      operation: "square",
      sourceSegmentObjectIds: ["origami-segment-1", "origami-segment-2"],
      unitReferenceObjectIds: ["origami-unit-segment-1"],
      guideLineObjectIds: ["origami-guide-line-1", "origami-guide-line-2"],
      selectedIntersectionObjectIds: ["origami-intersection-1"],
      resultSegmentObjectIds: ["origami-segment-3"],
      proofClaimIds: ["origami-claim-square"],
      branchSelections: [
        {
          id: "square-multiplication-specialization",
          label: "Square via multiplication branch",
          selected: true,
        },
      ],
    });
    expect(
      scene.objects.find(({ id }) => id === "origami-input-copy-2"),
    ).toMatchObject({
      provenance: {
        expression: "a^2 second factor copy",
        sourceObjectIds: ["origami-segment-2"],
      },
    });
  });

  it("ships one example per supported basic arithmetic family", () => {
    const examples = compiledOrigamiArithmeticExamples();

    expect(examples.map(({ title }) => title)).toEqual([
      "Input length",
      "Constant length",
      "Addition trace",
      "Subtraction trace",
      "Multiplication trace",
      "Division trace",
      "Square trace",
      "Square root trace",
    ]);
    expect(examples.map(({ scene }) => scene.value)).toEqual([
      3, 2, 5, 1, 6, 3, 9, 2,
    ]);
  });

  it("returns readable origami-specific errors for invalid inputs", () => {
    expect(() => compileOrigamiExpression(parseExpression("z"), {})).toThrow(
      new OrigamiCompilerError("Supply a value for z.", "MISSING_VARIABLE"),
    );
    expect(() =>
      compileOrigamiExpression(parseExpression("a/0"), { a: 3 }),
    ).toThrow(/Division by zero/i);
    expect(() =>
      compileOrigamiExpression(parseExpression("a^3"), { a: 3 }),
    ).toThrow(/Only squaring/i);
    expect(() =>
      compileOrigamiExpression(parseExpression("sqrt(a)"), { a: -1 }),
    ).toThrow(/negative length/i);
  });

  it("does not import the compass-straightedge compiler", () => {
    const source = readFileSync(
      "src/domain/origami/compiler/compileOrigamiExpression.ts",
      "utf8",
    );
    expect(source).not.toContain("compileExpression");
    expect(source).not.toContain("../construction");
  });
});
