import type {
  OrigamiFunctionLengthTransfer,
  OrigamiFunctionPlan,
} from "./types";

export type OrigamiFunctionReuseOptimizationItem = {
  transferId: string;
  expression: string;
  sourceNodeId: string;
  sourceNodeKind: string;
  outputObjectId: string;
  avoidedPhaseCount: number;
  summary: string;
};

export type OrigamiFunctionReuseOptimizationSummary = {
  transferCount: number;
  reusedExpressionCount: number;
  avoidedPhaseCount: number;
  items: OrigamiFunctionReuseOptimizationItem[];
  summary: string;
};

const operationPhaseCountForTransfer = (
  plan: OrigamiFunctionPlan,
  transfer: OrigamiFunctionLengthTransfer,
) => {
  const operation = plan.operations.find(
    ({ kind, nodeId }) =>
      kind !== "reuse-length" &&
      kind !== "extract-result" &&
      nodeId === transfer.fromNodeId,
  );
  return operation?.phaseIds.length ?? 0;
};

export function origamiFunctionReuseOptimizationSummary(
  plan: OrigamiFunctionPlan,
): OrigamiFunctionReuseOptimizationSummary {
  const expressionSet = new Set<string>();
  const items = plan.lengthTransfers.map((transfer) => {
    expressionSet.add(transfer.expression);
    const sourceNode = plan.nodes.find(({ id }) => id === transfer.fromNodeId);
    const avoidedPhaseCount = operationPhaseCountForTransfer(plan, transfer);
    return {
      transferId: transfer.id,
      expression: transfer.expression,
      sourceNodeId: transfer.fromNodeId,
      sourceNodeKind: sourceNode?.kind ?? "node",
      outputObjectId: transfer.outputObjectId,
      avoidedPhaseCount,
      summary:
        avoidedPhaseCount > 0
          ? `Reusing ${transfer.expression} avoids replaying ${avoidedPhaseCount} source phase${avoidedPhaseCount === 1 ? "" : "s"}.`
          : `Reusing ${transfer.expression} records a shared length without adding duplicate source phases.`,
    };
  });
  const avoidedPhaseCount = items.reduce(
    (total, item) => total + item.avoidedPhaseCount,
    0,
  );
  return {
    transferCount: plan.lengthTransfers.length,
    reusedExpressionCount: expressionSet.size,
    avoidedPhaseCount,
    items,
    summary:
      plan.lengthTransfers.length === 0
        ? "No repeated subexpression lengths are currently reusable."
        : `${plan.lengthTransfers.length} transfer${plan.lengthTransfers.length === 1 ? "" : "s"} reuse ${expressionSet.size} expression${expressionSet.size === 1 ? "" : "s"} and avoid ${avoidedPhaseCount} duplicate source phase${avoidedPhaseCount === 1 ? "" : "s"}.`,
  };
}
