import { evaluateOrigamiFunctionInput } from "./functionInput";
import { createOrigamiFunctionPlan } from "./functionPlan";

const validInput = (source: string, values?: Record<string, number>) => {
  const input = evaluateOrigamiFunctionInput(source, values);
  if (input.status !== "valid") throw new Error("Expected valid input");
  return input;
};

describe("origami function plan", () => {
  it("records expression nodes, dependencies, operations, and result extraction", () => {
    const plan = createOrigamiFunctionPlan(validInput("f(a,b)=a*b"));

    expect(plan).toMatchObject({
      id: "origami-function-plan-f-a-b-a-b",
      resultObjectId: "origami-function-result",
      resultExtraction: {
        nodeId: "origami-function-node-3",
        phaseId: "origami-function-phase-9",
        outputObjectId: "origami-function-result",
      },
    });
    expect(plan.nodes).toEqual([
      expect.objectContaining({
        id: "origami-function-node-1",
        kind: "input",
        expression: "a",
        order: 1,
        dependencyDepth: 0,
        dependencies: [],
        value: 3,
      }),
      expect.objectContaining({
        id: "origami-function-node-2",
        kind: "input",
        expression: "b",
        order: 2,
        dependencyDepth: 0,
        dependencies: [],
        value: 2,
      }),
      expect.objectContaining({
        id: "origami-function-node-3",
        kind: "mul",
        expression: "a * b",
        order: 3,
        dependencyDepth: 1,
        dependencies: ["origami-function-node-1", "origami-function-node-2"],
        value: 6,
      }),
    ]);
    expect(plan.operations.map(({ kind }) => kind)).toEqual([
      "place-input",
      "place-input",
      "multiply-lengths",
      "extract-result",
    ]);
    expect(plan.operations.map(({ order }) => order)).toEqual([1, 2, 3, 4]);
    expect(plan.operations[2].phaseIds).toEqual([
      "origami-function-phase-4",
      "origami-function-phase-5",
      "origami-function-phase-6",
      "origami-function-phase-7",
      "origami-function-phase-8",
    ]);
    expect(plan.phases.map(({ kind }) => kind)).toEqual([
      "place-paper",
      "mark-input",
      "mark-input",
      "align-fold",
      "preview-crease",
      "fold",
      "transfer",
      "mark-intersection",
      "extract-result",
    ]);
    expect(plan.phases.slice(3, 8).map(({ foldMotion }) => foldMotion)).toEqual(
      [
        expect.objectContaining({
          direction: "mountain",
          hingeLine: expect.objectContaining({
            id: "origami-function-hinge-3",
          }),
          movingPaperRegion: expect.objectContaining({
            id: "origami-function-moving-region-3",
          }),
          stationaryPaperRegion: expect.objectContaining({
            id: "origami-function-stationary-region-3",
          }),
          selectedBranch: expect.objectContaining({
            id: "intercept-product-branch",
          }),
        }),
        expect.objectContaining({
          direction: "flat",
          sideExposure: { before: "front", after: "front" },
        }),
        expect.objectContaining({
          direction: "mountain",
          sideExposure: { before: "front", after: "back" },
        }),
        expect.objectContaining({
          direction: "mountain",
          sideExposure: { before: "front", after: "back" },
        }),
        expect.objectContaining({
          direction: "mountain",
          sideExposure: { before: "front", after: "front" },
        }),
      ],
    );
    expect(plan.phases.map(({ physicalStatus }) => physicalStatus)).toEqual([
      "proven-physical",
      "proven-physical",
      "proven-physical",
      "explanatory-fallback",
      "explanatory-fallback",
      "explanatory-fallback",
      "explanatory-fallback",
      "explanatory-fallback",
      "explanatory-fallback",
    ]);
    expect(plan.phases[3]).toMatchObject({
      fallback: {
        label: "Explanatory fallback trace",
        replacementFor: "mul:align-fold",
      },
    });
    expect(plan.phases.at(-1)).toMatchObject({
      fallback: {
        label: "Explanatory result extraction",
        replacementFor: "extract-result",
      },
    });
    expect(plan.executionOrder).toEqual([
      "origami-function-node-1",
      "origami-function-node-2",
      "origami-function-node-3",
    ]);
    expect(plan.dependencyJumpTargets).toEqual([
      expect.objectContaining({
        nodeId: "origami-function-node-1",
        expression: "a",
        order: 1,
        phaseId: "origami-function-phase-2",
      }),
      expect.objectContaining({
        nodeId: "origami-function-node-2",
        expression: "b",
        order: 2,
        phaseId: "origami-function-phase-3",
      }),
      expect.objectContaining({
        nodeId: "origami-function-node-3",
        expression: "a * b",
        order: 3,
        phaseId: "origami-function-phase-9",
      }),
    ]);
    expect(plan.phases.every(({ exportId }) => exportId)).toBe(true);
  });

  it("keeps dependencies before dependents in execution order", () => {
    const plan = createOrigamiFunctionPlan(validInput("sqrt((a+b)*(a+b))"));
    const orderByNode = new Map(
      plan.nodes.map(({ id, order }) => [id, order] as const),
    );

    for (const node of plan.nodes) {
      for (const dependency of node.dependencies) {
        expect(orderByNode.get(dependency)).toBeLessThan(node.order);
      }
    }
    expect(plan.nodes.at(-1)).toMatchObject({
      expression: "sqrt((a + b) * (a + b))",
      dependencyDepth: 3,
    });
    expect(
      plan.phases
        .filter(({ kind }) => kind === "fold")
        .map(({ foldMotion }) => foldMotion?.selectedBranch.id),
    ).toEqual([
      "baseline-addition-transfer",
      "intercept-product-branch",
      "positive-geometric-mean-branch",
    ]);
    expect(plan.lengthTransfers).toEqual([
      expect.objectContaining({
        expression: "a + b",
        fromNodeId: "origami-function-node-3",
      }),
    ]);
  });

  it("records reusable length transfers for repeated subexpressions", () => {
    const plan = createOrigamiFunctionPlan(validInput("f(a)=a+a"));

    expect(plan.nodes.map(({ expression }) => expression)).toEqual([
      "a",
      "a + a",
    ]);
    expect(plan.lengthTransfers).toEqual([
      {
        id: "origami-function-transfer-1",
        fromNodeId: "origami-function-node-1",
        expression: "a",
        outputObjectId: "origami-function-transfer-output-1",
        reason: "reuse-subexpression",
      },
    ]);
    expect(plan.operations.map(({ kind }) => kind)).toContain("reuse-length");
    expect(plan.nodes.at(-1)).toMatchObject({
      expression: "a + a",
      value: 6,
    });
  });
});
