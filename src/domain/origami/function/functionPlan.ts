import { formatExpression } from "../../expression/format";
import type { Expr } from "../../expression/types";
import type {
  OrigamiFunctionPanelState,
  OrigamiFunctionFoldMotion,
  OrigamiFunctionPlan,
  OrigamiFunctionPlanNode,
  OrigamiFunctionPlanNodeKind,
  OrigamiFunctionPlanOperation,
  OrigamiFunctionPlanOperationKind,
  OrigamiFunctionPlanPhase,
  OrigamiFunctionPlanPhaseKind,
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

const arithmeticPhaseKinds: OrigamiFunctionPlanPhaseKind[] = [
  "align-fold",
  "preview-crease",
  "fold",
  "transfer",
  "mark-intersection",
];

const branchForNode = (node: OrigamiFunctionPlanNode) => {
  switch (node.kind) {
    case "add":
      return {
        id: "baseline-addition-transfer",
        label: "Baseline addition transfer",
        reason:
          "Place the second length after the first along the oriented paper baseline.",
      };
    case "sub":
      return {
        id: "directed-subtraction-transfer",
        label: "Directed subtraction transfer",
        reason:
          "Fold the subtrahend back along the oriented baseline to preserve signed length.",
      };
    case "mul":
      return {
        id: "intercept-product-branch",
        label: "Intercept product branch",
        reason:
          "Use the positive similar-triangle branch for sampled multiplication.",
      };
    case "div":
      return {
        id: "reciprocal-quotient-branch",
        label: "Reciprocal quotient branch",
        reason:
          "Use the nonzero-denominator reciprocal branch selected by sampled validation.",
      };
    case "pow":
      return {
        id: "repeated-power-transfer",
        label: "Repeated power transfer",
        reason:
          "Treat the supported integer power as repeated length multiplication.",
      };
    case "sqrt":
      return {
        id: "positive-geometric-mean-branch",
        label: "Positive geometric-mean branch",
        reason:
          "Select the nonnegative square-root intersection guaranteed by sampled validation.",
      };
    case "constant":
    case "input":
      return {
        id: "mark-length",
        label: "Mark sampled length",
        reason: "Inputs and constants are marked before animated fold phases.",
      };
  }
};

const foldMotionForNode = (
  node: OrigamiFunctionPlanNode,
  phaseKind: OrigamiFunctionPlanPhaseKind,
): OrigamiFunctionFoldMotion => {
  const x = node.order;
  const y = node.dependencyDepth;
  return {
    direction:
      phaseKind === "preview-crease"
        ? "flat"
        : node.order % 2 === 0
          ? "valley"
          : "mountain",
    hingeLine: {
      id: `origami-function-hinge-${node.order}`,
      point: { x, y },
      direction: { x: 1, y: node.kind === "sqrt" ? 1 : 0 },
    },
    movingPaperRegion: {
      id: `origami-function-moving-region-${node.order}`,
      vertices: [
        { x, y },
        { x: x + 1, y },
        { x: x + 1, y: y + 1 },
        { x, y: y + 1 },
      ],
    },
    stationaryPaperRegion: {
      id: `origami-function-stationary-region-${node.order}`,
      vertices: [
        { x: 0, y: 0 },
        { x, y: 0 },
        { x, y },
        { x: 0, y },
      ],
    },
    sideExposure: {
      before: "front",
      after:
        phaseKind === "fold" || phaseKind === "transfer" ? "back" : "front",
    },
    selectedBranch: branchForNode(node),
  };
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
        order: operations.length + 1,
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
      order: nodeIndex,
      dependencyDepth:
        dependencyNodes.length === 0
          ? 0
          : Math.max(
              ...dependencyNodes.map(({ dependencyDepth }) => dependencyDepth),
            ) + 1,
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
      order: operations.length + 1,
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
  const nodePhaseIds = new Map<string, string[]>();
  const phaseForJump = new Map<string, string>();
  const resultObjectId = "origami-function-result";
  const phases: OrigamiFunctionPlanPhase[] = [];
  const addPhase = (
    phase: Omit<OrigamiFunctionPlanPhase, "id" | "exportId">,
  ) => {
    const id = `origami-function-phase-${phases.length + 1}`;
    const nextPhase = {
      ...phase,
      id,
      exportId: `origami-function-export-phase-${phases.length + 1}`,
    };
    phases.push(nextPhase);
    return id;
  };

  addPhase({
    kind: "place-paper",
    expression: input.validation.source.source,
    sourceObjectIds: [],
    outputObjectIds: ["origami-function-paper"],
    proofClaimIds: [],
  });

  for (const node of nodes) {
    const nodeSourceObjectIds = node.dependencies
      .map((dependency) => nodes.find(({ id }) => id === dependency))
      .filter((dependency): dependency is OrigamiFunctionPlanNode =>
        Boolean(dependency),
      )
      .map(({ outputObjectId }) => outputObjectId);
    const phaseIds =
      node.kind === "input" || node.kind === "constant"
        ? [
            addPhase({
              kind: "mark-input",
              expression: node.expression,
              sourceObjectIds: [],
              outputObjectIds: [node.outputObjectId],
              proofClaimIds: [],
            }),
          ]
        : arithmeticPhaseKinds.map((kind) =>
            addPhase({
              kind,
              expression: node.expression,
              sourceObjectIds: nodeSourceObjectIds,
              outputObjectIds:
                kind === "mark-intersection"
                  ? [node.outputObjectId]
                  : [`${node.outputObjectId}-${kind}`],
              proofClaimIds: [],
              foldMotion: foldMotionForNode(node, kind),
            }),
          );
    nodePhaseIds.set(node.id, phaseIds);
    phaseForJump.set(node.id, phaseIds[0]);
  }

  const resultPhaseId = addPhase({
    kind: "extract-result",
    expression: input.validation.source.source,
    sourceObjectIds: [resultNode.outputObjectId],
    outputObjectIds: [resultObjectId],
    proofClaimIds: [],
  });
  phaseForJump.set(resultNode.id, resultPhaseId);
  operations.push({
    id: `origami-function-operation-${operations.length + 1}`,
    kind: "extract-result",
    order: operations.length + 1,
    nodeId: resultNode.id,
    dependencyNodeIds: [resultNode.id],
    phaseIds: [resultPhaseId],
    sourceObjectIds: [resultNode.outputObjectId],
    outputObjectIds: [resultObjectId],
    proofClaimIds: [],
  });

  const operationsWithPhases = operations.map((operation) => ({
    ...operation,
    phaseIds:
      operation.kind === "extract-result"
        ? [resultPhaseId]
        : (nodePhaseIds.get(operation.nodeId) ?? operation.phaseIds),
  }));

  return {
    id: `origami-function-plan-${expressionSlug}`,
    source: input.validation.source,
    values: input.validation.values,
    nodes,
    operations: operationsWithPhases,
    executionOrder: nodes.map(({ id }) => id),
    dependencyJumpTargets: nodes.map((node) => ({
      nodeId: node.id,
      expression: node.expression,
      order: node.order,
      dependencyNodeIds: node.dependencies,
      outputObjectId: node.outputObjectId,
      phaseId: phaseForJump.get(node.id),
    })),
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
