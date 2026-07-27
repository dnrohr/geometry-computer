import type { OrigamiFunctionPlan } from "./types";

export type OrigamiFunctionPlanVerificationIssueCode =
  | "DUPLICATE_ID"
  | "MISSING_NODE"
  | "MISSING_PHASE"
  | "MISSING_OPERATION"
  | "MISSING_OBJECT";

export type OrigamiFunctionPlanVerificationIssue = {
  code: OrigamiFunctionPlanVerificationIssueCode;
  severity: "error" | "warning";
  summary: string;
  referenceId: string;
};

export type OrigamiFunctionPlanVerification = {
  status: "verified" | "has-issues";
  checkedNodeCount: number;
  checkedOperationCount: number;
  checkedPhaseCount: number;
  checkedTransferCount: number;
  issueCount: number;
  issues: OrigamiFunctionPlanVerificationIssue[];
  summary: string;
};

const duplicateIds = (ids: string[]) => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      duplicates.add(id);
    }
    seen.add(id);
  }
  return [...duplicates];
};

const pushIssue = (
  issues: OrigamiFunctionPlanVerificationIssue[],
  issue: OrigamiFunctionPlanVerificationIssue,
) => {
  issues.push(issue);
};

const plural = (count: number, singular: string, pluralForm = `${singular}s`) =>
  `${count} ${count === 1 ? singular : pluralForm}`;

export function verifyOrigamiFunctionPlan(
  plan: OrigamiFunctionPlan,
): OrigamiFunctionPlanVerification {
  const issues: OrigamiFunctionPlanVerificationIssue[] = [];
  const nodeIds = new Set(plan.nodes.map(({ id }) => id));
  const phaseIds = new Set(plan.phases.map(({ id }) => id));
  const objectIds = new Set<string>();

  for (const node of plan.nodes) {
    objectIds.add(node.outputObjectId);
  }
  for (const phase of plan.phases) {
    for (const objectId of phase.sourceObjectIds) objectIds.add(objectId);
    for (const objectId of phase.outputObjectIds) objectIds.add(objectId);
  }
  for (const transfer of plan.lengthTransfers) {
    objectIds.add(transfer.outputObjectId);
  }
  if (plan.resultObjectId) objectIds.add(plan.resultObjectId);

  for (const id of duplicateIds(plan.nodes.map(({ id }) => id))) {
    pushIssue(issues, {
      code: "DUPLICATE_ID",
      severity: "error",
      referenceId: id,
      summary: `Node id ${id} is duplicated.`,
    });
  }
  for (const id of duplicateIds(plan.operations.map(({ id }) => id))) {
    pushIssue(issues, {
      code: "DUPLICATE_ID",
      severity: "error",
      referenceId: id,
      summary: `Operation id ${id} is duplicated.`,
    });
  }
  for (const id of duplicateIds(plan.phases.map(({ id }) => id))) {
    pushIssue(issues, {
      code: "DUPLICATE_ID",
      severity: "error",
      referenceId: id,
      summary: `Phase id ${id} is duplicated.`,
    });
  }

  for (const node of plan.nodes) {
    for (const dependencyId of node.dependencies) {
      if (!nodeIds.has(dependencyId)) {
        pushIssue(issues, {
          code: "MISSING_NODE",
          severity: "error",
          referenceId: dependencyId,
          summary: `${node.id} depends on missing node ${dependencyId}.`,
        });
      }
    }
  }

  for (const operation of plan.operations) {
    if (!nodeIds.has(operation.nodeId)) {
      pushIssue(issues, {
        code: "MISSING_NODE",
        severity: "error",
        referenceId: operation.nodeId,
        summary: `${operation.id} references missing node ${operation.nodeId}.`,
      });
    }
    for (const dependencyNodeId of operation.dependencyNodeIds) {
      if (!nodeIds.has(dependencyNodeId)) {
        pushIssue(issues, {
          code: "MISSING_NODE",
          severity: "error",
          referenceId: dependencyNodeId,
          summary: `${operation.id} depends on missing node ${dependencyNodeId}.`,
        });
      }
    }
    for (const phaseId of operation.phaseIds) {
      if (!phaseIds.has(phaseId)) {
        pushIssue(issues, {
          code: "MISSING_PHASE",
          severity: "error",
          referenceId: phaseId,
          summary: `${operation.id} references missing phase ${phaseId}.`,
        });
      }
    }
  }

  for (const jumpTarget of plan.dependencyJumpTargets) {
    if (!nodeIds.has(jumpTarget.nodeId)) {
      pushIssue(issues, {
        code: "MISSING_NODE",
        severity: "error",
        referenceId: jumpTarget.nodeId,
        summary: `Jump target references missing node ${jumpTarget.nodeId}.`,
      });
    }
    if (jumpTarget.phaseId && !phaseIds.has(jumpTarget.phaseId)) {
      pushIssue(issues, {
        code: "MISSING_PHASE",
        severity: "error",
        referenceId: jumpTarget.phaseId,
        summary: `Jump target ${jumpTarget.nodeId} references missing phase ${jumpTarget.phaseId}.`,
      });
    }
  }

  for (const transfer of plan.lengthTransfers) {
    if (!nodeIds.has(transfer.fromNodeId)) {
      pushIssue(issues, {
        code: "MISSING_NODE",
        severity: "error",
        referenceId: transfer.fromNodeId,
        summary: `${transfer.id} references missing source node ${transfer.fromNodeId}.`,
      });
    }
    const reuseOperation = plan.operations.find(
      ({ kind, outputObjectIds }) =>
        kind === "reuse-length" &&
        outputObjectIds.includes(transfer.outputObjectId),
    );
    if (!reuseOperation) {
      pushIssue(issues, {
        code: "MISSING_OPERATION",
        severity: "error",
        referenceId: transfer.id,
        summary: `${transfer.id} has no matching reuse-length operation.`,
      });
    }
  }

  if (!nodeIds.has(plan.resultExtraction.nodeId)) {
    pushIssue(issues, {
      code: "MISSING_NODE",
      severity: "error",
      referenceId: plan.resultExtraction.nodeId,
      summary: `Result extraction references missing node ${plan.resultExtraction.nodeId}.`,
    });
  }
  if (!phaseIds.has(plan.resultExtraction.phaseId)) {
    pushIssue(issues, {
      code: "MISSING_PHASE",
      severity: "error",
      referenceId: plan.resultExtraction.phaseId,
      summary: `Result extraction references missing phase ${plan.resultExtraction.phaseId}.`,
    });
  }
  if (!objectIds.has(plan.resultExtraction.outputObjectId)) {
    pushIssue(issues, {
      code: "MISSING_OBJECT",
      severity: "warning",
      referenceId: plan.resultExtraction.outputObjectId,
      summary: `Result extraction output ${plan.resultExtraction.outputObjectId} is not produced by a node, phase, transfer, or result object.`,
    });
  }

  const status = issues.length === 0 ? "verified" : "has-issues";
  return {
    status,
    checkedNodeCount: plan.nodes.length,
    checkedOperationCount: plan.operations.length,
    checkedPhaseCount: plan.phases.length,
    checkedTransferCount: plan.lengthTransfers.length,
    issueCount: issues.length,
    issues,
    summary:
      status === "verified"
        ? `Verified ${plural(plan.nodes.length, "node")}, ${plural(plan.operations.length, "operation")}, ${plural(plan.phases.length, "phase")}, and ${plural(plan.lengthTransfers.length, "length transfer")}.`
        : `${plural(issues.length, "plan verification issue", "plan verification issues")} found across ${plural(plan.nodes.length, "node")}, ${plural(plan.operations.length, "operation")}, ${plural(plan.phases.length, "phase")}, and ${plural(plan.lengthTransfers.length, "length transfer")}.`,
  };
}
