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

export type OrigamiFunctionPlanPhase = {
  id: string;
  kind: OrigamiFunctionPlanPhaseKind;
  expression: string;
  sourceObjectIds: string[];
  outputObjectIds: string[];
  proofClaimIds: string[];
};

export type OrigamiFunctionPlan = {
  id: string;
  source: OrigamiFunctionSource;
  values: Record<string, number>;
  phases: OrigamiFunctionPlanPhase[];
  diagnostics: OrigamiAllowableFieldIssue[];
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
  paperStyle: OrigamiPaperStyle;
  exportedAt?: string;
};
