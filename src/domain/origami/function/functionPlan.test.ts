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
        phaseId: "origami-function-phase-4",
        outputObjectId: "origami-function-result",
      },
    });
    expect(plan.nodes).toEqual([
      expect.objectContaining({
        id: "origami-function-node-1",
        kind: "input",
        expression: "a",
        dependencies: [],
        value: 3,
      }),
      expect.objectContaining({
        id: "origami-function-node-2",
        kind: "input",
        expression: "b",
        dependencies: [],
        value: 2,
      }),
      expect.objectContaining({
        id: "origami-function-node-3",
        kind: "mul",
        expression: "a * b",
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
    expect(plan.phases.every(({ exportId }) => exportId)).toBe(true);
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
