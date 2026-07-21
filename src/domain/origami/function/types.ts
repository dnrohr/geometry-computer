import type { Expr } from "../../expression/types";
import type { OrigamiAllowableFieldIssue } from "./allowableField";

export type OrigamiFunctionSource = {
  ast: Expr;
  expressionSource: string;
  functionName: string;
  source: string;
  signatureVariables?: string[];
  variables: string[];
};

export type OrigamiFunctionValidation = {
  source: OrigamiFunctionSource;
  values: Record<string, number>;
  value?: number;
  issues: OrigamiAllowableFieldIssue[];
};

export type OrigamiFunctionParseFailure = {
  source: string;
  error: string;
};

export type OrigamiFunctionPanelState =
  | { status: "valid"; validation: OrigamiFunctionValidation }
  | { status: "blocked"; validation: OrigamiFunctionValidation }
  | { status: "parse-error"; failure: OrigamiFunctionParseFailure };

export type OrigamiFunctionPlanPhaseKind =
  | "place-paper"
  | "mark-input"
  | "align-fold"
  | "preview-crease"
  | "fold"
  | "transfer"
  | "mark-intersection"
  | "extract-result"
  | "diagnostic";

export type OrigamiFunctionFoldDirection = "mountain" | "valley" | "flat";

export type OrigamiFunctionHingeLine = {
  id: string;
  point: { x: number; y: number };
  direction: { x: number; y: number };
};

export type OrigamiFunctionPaperRegion = {
  id: string;
  vertices: Array<{ x: number; y: number }>;
};

export type OrigamiFunctionSideExposure = {
  before: "front" | "back" | "both";
  after: "front" | "back" | "both";
};

export type OrigamiFunctionSelectedBranch = {
  id: string;
  label: string;
  reason: string;
};

export type OrigamiFunctionFoldMotion = {
  direction: OrigamiFunctionFoldDirection;
  hingeLine: OrigamiFunctionHingeLine;
  movingPaperRegion: OrigamiFunctionPaperRegion;
  stationaryPaperRegion: OrigamiFunctionPaperRegion;
  sideExposure: OrigamiFunctionSideExposure;
  selectedBranch: OrigamiFunctionSelectedBranch;
};

export type OrigamiFunctionPhasePhysicalStatus =
  | "proven-physical"
  | "explanatory-fallback";

export type OrigamiFunctionFallbackPhase = {
  label: string;
  reason: string;
  replacementFor: string;
};

export type OrigamiFunctionFoldCertificateMethod =
  | "paper-placement"
  | "mark-length"
  | "identity-result"
  | "baseline-addition-transfer"
  | "directed-subtraction-transfer";

export type OrigamiFunctionFoldCertificate = {
  id: string;
  phaseId: string;
  method: OrigamiFunctionFoldCertificateMethod;
  targetObjectIds: string[];
  summary: string;
};

export type OrigamiFunctionPlanPhase = {
  id: string;
  kind: OrigamiFunctionPlanPhaseKind;
  expression: string;
  sourceObjectIds: string[];
  outputObjectIds: string[];
  proofClaimIds: string[];
  exportId?: string;
  foldMotion?: OrigamiFunctionFoldMotion;
  physicalStatus: OrigamiFunctionPhasePhysicalStatus;
  foldCertificate?: OrigamiFunctionFoldCertificate;
  fallback?: OrigamiFunctionFallbackPhase;
};

export type OrigamiFunctionPlanNodeKind =
  | "input"
  | "constant"
  | "add"
  | "sub"
  | "mul"
  | "div"
  | "pow"
  | "sqrt";

export type OrigamiFunctionPlanNode = {
  id: string;
  kind: OrigamiFunctionPlanNodeKind;
  expression: string;
  order: number;
  dependencyDepth: number;
  dependencies: string[];
  value: number;
  outputObjectId: string;
};

export type OrigamiFunctionPlanOperationKind =
  | "place-input"
  | "place-constant"
  | "add-lengths"
  | "subtract-lengths"
  | "multiply-lengths"
  | "divide-lengths"
  | "power-length"
  | "extract-square-root"
  | "reuse-length"
  | "extract-result";

export type OrigamiFunctionPlanOperation = {
  id: string;
  kind: OrigamiFunctionPlanOperationKind;
  order: number;
  nodeId: string;
  dependencyNodeIds: string[];
  phaseIds: string[];
  sourceObjectIds: string[];
  outputObjectIds: string[];
  proofClaimIds: string[];
};

export type OrigamiFunctionLengthTransfer = {
  id: string;
  fromNodeId: string;
  expression: string;
  outputObjectId: string;
  reason: "reuse-subexpression";
};

export type OrigamiFunctionDependencyJumpTarget = {
  nodeId: string;
  expression: string;
  order: number;
  dependencyNodeIds: string[];
  outputObjectId: string;
  phaseId?: string;
};

export type OrigamiFunctionResultExtraction = {
  nodeId: string;
  phaseId: string;
  outputObjectId: string;
};

export type OrigamiFunctionPlanDiagnosticCode =
  | "REUSED_SUBEXPRESSION"
  | "REPEATED_VARIABLE"
  | "NEGATIVE_DIRECTED_LENGTH"
  | "BRANCH_AMBIGUITY"
  | "ACCUMULATED_SCALE";

export type OrigamiFunctionPlanDiagnostic = {
  code: OrigamiFunctionPlanDiagnosticCode;
  severity: "info" | "warning";
  expression: string;
  message: string;
  nodeIds: string[];
};

export type OrigamiFunctionSolverReadinessStatus = "ready" | "needs-solver";

export type OrigamiFunctionSolverCapability =
  | "arithmetic-macro-fold"
  | "result-extraction-fold";

export type OrigamiFunctionSolverWorkItem = {
  id: string;
  phaseId: string;
  phaseKind: OrigamiFunctionPlanPhaseKind;
  expression: string;
  sourceObjectIds: string[];
  outputObjectIds: string[];
  replacementFor: string;
  requiredCapability: OrigamiFunctionSolverCapability;
  selectedBranchId?: string;
  summary: string;
};

export type OrigamiFunctionSolverReadiness = {
  status: OrigamiFunctionSolverReadinessStatus;
  totalPhases: number;
  provenPhysicalPhases: number;
  certifiedPhases: number;
  fallbackPhases: number;
  fallbackPhaseIds: string[];
  workItems: OrigamiFunctionSolverWorkItem[];
  summary: string;
};

export type OrigamiFunctionPlan = {
  id: string;
  source: OrigamiFunctionSource;
  values: Record<string, number>;
  nodes: OrigamiFunctionPlanNode[];
  operations: OrigamiFunctionPlanOperation[];
  executionOrder: string[];
  dependencyJumpTargets: OrigamiFunctionDependencyJumpTarget[];
  lengthTransfers: OrigamiFunctionLengthTransfer[];
  resultExtraction: OrigamiFunctionResultExtraction;
  phases: OrigamiFunctionPlanPhase[];
  diagnostics: OrigamiFunctionPlanDiagnostic[];
  solverReadiness: OrigamiFunctionSolverReadiness;
  resultObjectId?: string;
};

export type OrigamiFoldAnimationState = {
  planId: string;
  phaseId: string;
  progress: number;
  playing: boolean;
  speed: number;
  reducedMotion: boolean;
};

export type OrigamiPaperPattern =
  | "solid"
  | "grid"
  | "dots"
  | "diagonal-stripe"
  | "washi-wave"
  | "coordinate-grid"
  | "high-contrast";

export type OrigamiPaperStyle = {
  frontColor: string;
  backColor: string;
  frontPattern: OrigamiPaperPattern;
  backPattern: OrigamiPaperPattern;
  creaseColor: string;
  highlightColor: string;
  opacity: number;
  patternScale: number;
  patternRotation: number;
};

export type OrigamiFunctionAnimationExport = {
  version: 1;
  plan: OrigamiFunctionPlan;
  animation: OrigamiFoldAnimationState;
  activePhase: OrigamiFunctionAnimationActivePhase;
  solverReadiness: OrigamiFunctionSolverReadiness;
  paperStyle: OrigamiPaperStyle;
  exportedAt?: string;
};

export type OrigamiFunctionAnimationActivePhase = {
  phaseId: string;
  phaseKind: OrigamiFunctionPlanPhaseKind;
  expression: string;
  physicalStatus: OrigamiFunctionPhasePhysicalStatus;
  foldCertificate?: OrigamiFunctionFoldCertificate;
  solverWorkItem?: OrigamiFunctionSolverWorkItem;
};
