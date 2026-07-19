import { formatExpression } from "../../expression/format";
import type { Expr } from "../../expression/types";
import type {
  OrigamiFunctionPanelState,
  OrigamiFunctionPlan,
  OrigamiFunctionPlanNode,
  OrigamiFunctionPlanNodeKind,
  OrigamiFunctionPlanOperation,
  OrigamiFunctionPlanOperationKind,
} from "./types";

type ValidOrigamiFunctionInput = Extract<
  OrigamiFunctionPanelState,
  { status: "valid" }
>;

const slug = (source: string) =>
  source
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "constant";

const operationKindForNode = (
  kind: OrigamiFunctionPlanNodeKind,
): OrigamiFunctionPlanOperationKind => {
  switch (kind) {
    case "input":
      return "place-input";
    case "constant":
      return "place-constant";
    case "add":
      return "add-lengths";
    case "sub":
      return "subtract-lengths";
    case "mul":
      return "multiply-lengths";
    case "div":
      return "divide-lengths";
    case "pow":
      return "power-length";
    case "sqrt":
      return "extract-square-root";
  }
};

const nodeKindForExpression = (expr: Expr): OrigamiFunctionPlanNodeKind =>
  expr.kind === "var"
    ? "input"
    : expr.kind === "const"
      ? "constant"
      : expr.kind;

const evaluateNode = (
  expr: Expr,
  values: Record<string, number>,
  dependencies: number[],
): number => {
  switch (expr.kind) {
    case "const":
      return expr.value;
    case "var":
      return values[expr.name];
    case "add":
      return dependencies[0] + dependencies[1];
    case "sub":
      return dependencies[0] - dependencies[1];
    case "mul":
      return dependencies[0] * dependencies[1];
    case "div":
      return dependencies[0] / dependencies[1];
    case "pow":
      return dependencies[0] ** expr.exponent;
    case "sqrt":
      return Math.sqrt(dependencies[0]);
  }
};

const expressionChildren = (expr: Expr): Expr[] => {
  switch (expr.kind) {
    case "add":
    case "sub":
    case "mul":
    case "div":
      return [expr.left, expr.right];
    case "pow":
      return [expr.base];
    case "sqrt":
      return [expr.value];
    case "const":
    case "var":
      return [];
  }
};

export function createOrigamiFunctionPlan(
  input: ValidOrigamiFunctionInput,
): OrigamiFunctionPlan {
  const nodes: OrigamiFunctionPlanNode[] = [];
  const operations: OrigamiFunctionPlanOperation[] = [];
  const lengthTransfers: OrigamiFunctionPlan["lengthTransfers"] = [];
  const nodeByExpression = new Map<string, OrigamiFunctionPlanNode>();
  const expressionSlug = slug(input.validation.source.source);

  const visit = (expr: Expr): OrigamiFunctionPlanNode => {
    const expression = formatExpression(expr);
    const existing = nodeByExpression.get(expression);
    if (existing) {
      const transferIndex = lengthTransfers.length + 1;
      lengthTransfers.push({
        id: `origami-function-transfer-${transferIndex}`,
        fromNodeId: existing.id,
        expression,
        outputObjectId: `origami-function-transfer-output-${transferIndex}`,
        reason: "reuse-subexpression",
      });
      operations.push({
        id: `origami-function-operation-${operations.length + 1}`,
        kind: "reuse-length",
        nodeId: existing.id,
        dependencyNodeIds: [existing.id],
        phaseIds: [],
        sourceObjectIds: [existing.outputObjectId],
        outputObjectIds: [`origami-function-transfer-output-${transferIndex}`],
        proofClaimIds: [],
      });
      return existing;
    }

    const dependencyNodes = expressionChildren(expr).map(visit);
    const kind = nodeKindForExpression(expr);
    const nodeIndex = nodes.length + 1;
    const node: OrigamiFunctionPlanNode = {
      id: `origami-function-node-${nodeIndex}`,
      kind,
      expression,
      dependencies: dependencyNodes.map(({ id }) => id),
      value: evaluateNode(
        expr,
        input.validation.values,
        dependencyNodes.map(({ value }) => value),
      ),
      outputObjectId: `origami-function-node-output-${nodeIndex}`,
    };
    nodes.push(node);
    nodeByExpression.set(expression, node);
    operations.push({
      id: `origami-function-operation-${operations.length + 1}`,
      kind: operationKindForNode(kind),
      nodeId: node.id,
      dependencyNodeIds: node.dependencies,
      phaseIds: [],
      sourceObjectIds: dependencyNodes.map(
        ({ outputObjectId }) => outputObjectId,
      ),
      outputObjectIds: [node.outputObjectId],
      proofClaimIds: [],
    });
    return node;
  };

  const resultNode = visit(input.validation.source.ast);
  const resultPhaseId = `origami-function-phase-${input.validation.source.variables.length + 2}`;
  const resultObjectId = "origami-function-result";
  const phases = [
    {
      id: "origami-function-phase-1",
      kind: "place-paper" as const,
      expression: input.validation.source.source,
      sourceObjectIds: [],
      outputObjectIds: ["origami-function-paper"],
      proofClaimIds: [],
      exportId: "origami-function-export-phase-1",
    },
    ...input.validation.source.variables.map((variable, index) => ({
      id: `origami-function-phase-${index + 2}`,
      kind: "mark-input" as const,
      expression: variable,
      sourceObjectIds: [],
      outputObjectIds: [`origami-function-input-${variable}`],
      proofClaimIds: [],
      exportId: `origami-function-export-phase-${index + 2}`,
    })),
    {
      id: resultPhaseId,
      kind: "extract-result" as const,
      expression: input.validation.source.source,
      sourceObjectIds: input.validation.source.variables.map(
        (variable) => `origami-function-input-${variable}`,
      ),
      outputObjectIds: [resultObjectId],
      proofClaimIds: [],
      exportId: `origami-function-export-phase-${input.validation.source.variables.length + 2}`,
    },
  ];
  operations.push({
    id: `origami-function-operation-${operations.length + 1}`,
    kind: "extract-result",
    nodeId: resultNode.id,
    dependencyNodeIds: [resultNode.id],
    phaseIds: [resultPhaseId],
    sourceObjectIds: [resultNode.outputObjectId],
    outputObjectIds: [resultObjectId],
    proofClaimIds: [],
  });

  return {
    id: `origami-function-plan-${expressionSlug}`,
    source: input.validation.source,
    values: input.validation.values,
    nodes,
    operations,
    lengthTransfers,
    resultExtraction: {
      nodeId: resultNode.id,
      phaseId: resultPhaseId,
      outputObjectId: resultObjectId,
    },
    phases,
    diagnostics: [],
    resultObjectId,
  };
}
