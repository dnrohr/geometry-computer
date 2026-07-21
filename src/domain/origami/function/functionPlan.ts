import { formatExpression } from "../../expression/format";
import type { Expr } from "../../expression/types";
import type {
  OrigamiFunctionPanelState,
  OrigamiFunctionFoldMotion,
  OrigamiFunctionPlan,
  OrigamiFunctionPlanDiagnostic,
  OrigamiFunctionPlanNode,
  OrigamiFunctionPlanNodeKind,
  OrigamiFunctionPlanOperation,
  OrigamiFunctionPlanOperationKind,
  OrigamiFunctionPlanPhase,
  OrigamiFunctionPlanPhaseKind,
  OrigamiFunctionSolverReadiness,
  OrigamiFunctionFoldCertificate,
  OrigamiFunctionSolverWorkItem,
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

const collectVariableOccurrences = (
  expr: Expr,
  occurrences = new Map<string, number>(),
) => {
  if (expr.kind === "var") {
    occurrences.set(expr.name, (occurrences.get(expr.name) ?? 0) + 1);
  }
  for (const child of expressionChildren(expr)) {
    collectVariableOccurrences(child, occurrences);
  }
  return occurrences;
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

const fallbackForNode = (
  node: OrigamiFunctionPlanNode,
  phaseKind: OrigamiFunctionPlanPhaseKind,
) => ({
  label: "Explanatory fallback trace",
  reason: `${node.expression} uses the ${branchForNode(node).label} macro, which is not yet backed by a physical fold solver.`,
  replacementFor: `${node.kind}:${phaseKind}`,
});

const arithmeticPhaseIsPhysical = (node: OrigamiFunctionPlanNode) =>
  node.kind === "add" || node.kind === "sub";

const createPlanDiagnostics = (
  input: ValidOrigamiFunctionInput,
  nodes: OrigamiFunctionPlanNode[],
  lengthTransfers: OrigamiFunctionPlan["lengthTransfers"],
): OrigamiFunctionPlanDiagnostic[] => {
  const diagnostics: OrigamiFunctionPlanDiagnostic[] = [];
  const nodeByExpression = new Map(
    nodes.map((node) => [node.expression, node]),
  );

  diagnostics.push(
    ...lengthTransfers.map((transfer) => ({
      code: "REUSED_SUBEXPRESSION" as const,
      severity: "info" as const,
      expression: transfer.expression,
      message: `${transfer.expression} is reused, so the animation plan includes an explicit length-transfer fallback.`,
      nodeIds: [transfer.fromNodeId],
    })),
  );

  for (const [variable, count] of collectVariableOccurrences(
    input.validation.source.ast,
  )) {
    if (count <= 1) continue;
    const node = nodeByExpression.get(variable);
    diagnostics.push({
      code: "REPEATED_VARIABLE",
      severity: "info",
      expression: variable,
      message: `${variable} appears ${count} times in the expression; repeated marks may be shown as copied sampled lengths.`,
      nodeIds: node ? [node.id] : [],
    });
  }

  for (const node of nodes) {
    if (node.value < 0) {
      diagnostics.push({
        code: "NEGATIVE_DIRECTED_LENGTH",
        severity: "warning",
        expression: node.expression,
        message: `${node.expression} evaluates to a negative directed length in the sampled plan.`,
        nodeIds: [node.id],
      });
    }
    if (Math.abs(node.value) > 10) {
      diagnostics.push({
        code: "ACCUMULATED_SCALE",
        severity: "warning",
        expression: node.expression,
        message: `${node.expression} has sampled magnitude ${node.value}, so later animation may need scale management.`,
        nodeIds: [node.id],
      });
    }
    if (node.kind === "sqrt" || node.kind === "div") {
      diagnostics.push({
        code: "BRANCH_AMBIGUITY",
        severity: "info",
        expression: node.expression,
        message: `${node.expression} has multiple geometric branches; the plan records the sampled selected branch.`,
        nodeIds: [node.id],
      });
    }
  }

  return diagnostics;
};

const createSolverReadiness = (
  phases: OrigamiFunctionPlanPhase[],
): OrigamiFunctionSolverReadiness => {
  const fallbackPhases = phases.filter(
    ({ physicalStatus }) => physicalStatus === "explanatory-fallback",
  );
  const fallbackPhaseIds = fallbackPhases.map(({ id }) => id);
  const workItems: OrigamiFunctionSolverWorkItem[] = fallbackPhases.map(
    (phase) => {
      const requiredCapability =
        phase.kind === "extract-result"
          ? "result-extraction-fold"
          : "arithmetic-macro-fold";
      return {
        id: `${phase.id}-solver-work`,
        phaseId: phase.id,
        phaseKind: phase.kind,
        expression: phase.expression,
        replacementFor: phase.fallback?.replacementFor ?? phase.kind,
        requiredCapability,
        selectedBranchId: phase.foldMotion?.selectedBranch.id,
        summary:
          phase.fallback?.reason ??
          `${phase.expression} needs physical fold-solver support.`,
      };
    },
  );
  const provenPhysicalPhases = phases.length - fallbackPhaseIds.length;
  const certifiedPhases = phases.filter(({ foldCertificate }) =>
    Boolean(foldCertificate),
  ).length;
  const status = fallbackPhaseIds.length === 0 ? "ready" : "needs-solver";

  return {
    status,
    totalPhases: phases.length,
    provenPhysicalPhases,
    certifiedPhases,
    fallbackPhases: fallbackPhaseIds.length,
    fallbackPhaseIds,
    workItems,
    summary:
      status === "ready"
        ? "All function animation phases are backed by physical fold steps."
        : `${fallbackPhaseIds.length} of ${phases.length} function animation phases still need physical fold-solver support.`,
  };
};

const certificateForPhase = (
  phase: Omit<OrigamiFunctionPlanPhase, "id" | "exportId">,
  phaseId: string,
): OrigamiFunctionFoldCertificate | undefined => {
  if (phase.physicalStatus !== "proven-physical") return undefined;
  switch (phase.kind) {
    case "place-paper":
      return {
        id: `${phaseId}-certificate`,
        phaseId,
        method: "paper-placement",
        targetObjectIds: phase.outputObjectIds,
        summary:
          "The paper boundary is placed as the fixed computation domain.",
      };
    case "mark-input":
      return {
        id: `${phaseId}-certificate`,
        phaseId,
        method: "mark-length",
        targetObjectIds: phase.outputObjectIds,
        summary:
          "The sampled input or constant length is directly marked on the paper baseline.",
      };
    case "extract-result":
      return {
        id: `${phaseId}-certificate`,
        phaseId,
        method: "identity-result",
        targetObjectIds: phase.outputObjectIds,
        summary:
          "The result is already present as a marked length and needs no additional fold.",
      };
    case "align-fold":
    case "preview-crease":
    case "fold":
    case "transfer":
    case "mark-intersection":
      if (
        phase.foldMotion?.selectedBranch.id === "baseline-addition-transfer" ||
        phase.foldMotion?.selectedBranch.id === "directed-subtraction-transfer"
      ) {
        const isSubtraction =
          phase.foldMotion.selectedBranch.id ===
          "directed-subtraction-transfer";
        return {
          id: `${phaseId}-certificate`,
          phaseId,
          method: isSubtraction
            ? "directed-subtraction-transfer"
            : "baseline-addition-transfer",
          targetObjectIds: phase.outputObjectIds,
          summary: isSubtraction
            ? "The directed subtraction length is certified as a baseline transfer fold."
            : "The addition length is certified as a baseline transfer fold.",
        };
      }
      return undefined;
    case "diagnostic":
      return undefined;
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
      foldCertificate: certificateForPhase(phase, id),
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
    physicalStatus: "proven-physical",
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
              physicalStatus: "proven-physical",
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
              physicalStatus: arithmeticPhaseIsPhysical(node)
                ? "proven-physical"
                : "explanatory-fallback",
              fallback: arithmeticPhaseIsPhysical(node)
                ? undefined
                : fallbackForNode(node, kind),
            }),
          );
    nodePhaseIds.set(node.id, phaseIds);
    phaseForJump.set(node.id, phaseIds[0]);
  }

  const resultExtractionIsPhysical =
    resultNode.kind === "input" ||
    resultNode.kind === "constant" ||
    resultNode.kind === "add" ||
    resultNode.kind === "sub";
  const resultPhaseId = addPhase({
    kind: "extract-result",
    expression: input.validation.source.source,
    sourceObjectIds: [resultNode.outputObjectId],
    outputObjectIds: [resultObjectId],
    proofClaimIds: [],
    physicalStatus: resultExtractionIsPhysical
      ? "proven-physical"
      : "explanatory-fallback",
    fallback: resultExtractionIsPhysical
      ? undefined
      : {
          label: "Explanatory result extraction",
          reason:
            "The final extraction references the deterministic function plan until physical fold playback is solved.",
          replacementFor: "extract-result",
        },
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
  const diagnostics = createPlanDiagnostics(input, nodes, lengthTransfers);
  const solverReadiness = createSolverReadiness(phases);

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
    diagnostics,
    solverReadiness,
    resultObjectId,
  };
}
