import {
  DEFAULT_ORIGAMI_FUNCTION_VALUES,
  evaluateOrigamiFunctionInput,
} from "./functionInput";
import type {
  OrigamiFoldAnimationState,
  OrigamiFunctionPanelState,
  OrigamiFunctionPlan,
  OrigamiPaperStyle,
} from "./types";

export type OrigamiFunctionPreview =
  | {
      status: "compiled";
      input: Extract<OrigamiFunctionPanelState, { status: "valid" }>;
      plan: OrigamiFunctionPlan;
      animation: OrigamiFoldAnimationState;
      paperStyle: OrigamiPaperStyle;
    }
  | {
      status: "blocked";
      input: Exclude<OrigamiFunctionPanelState, { status: "valid" }>;
    };

export const DEFAULT_ORIGAMI_PAPER_STYLE: OrigamiPaperStyle = {
  frontColor: "#f7f0d4",
  backColor: "#365f91",
  frontPattern: "grid",
  backPattern: "diagonal-stripe",
  creaseColor: "#e8b65c",
  highlightColor: "#fff2bb",
  opacity: 1,
  patternScale: 1,
  patternRotation: 0,
};

const slug = (source: string) =>
  source
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "constant";

const createPlan = (
  input: Extract<OrigamiFunctionPanelState, { status: "valid" }>,
): OrigamiFunctionPlan => {
  const expressionSlug = slug(input.validation.source.source);
  const variables = input.validation.source.variables;
  return {
    id: `origami-function-plan-${expressionSlug}`,
    source: input.validation.source,
    values: input.validation.values,
    phases: [
      {
        id: "origami-function-phase-1",
        kind: "place-paper",
        expression: input.validation.source.source,
        sourceObjectIds: [],
        outputObjectIds: ["origami-function-paper"],
        proofClaimIds: [],
      },
      ...variables.map((variable, index) => ({
        id: `origami-function-phase-${index + 2}`,
        kind: "mark-input" as const,
        expression: variable,
        sourceObjectIds: [],
        outputObjectIds: [`origami-function-input-${variable}`],
        proofClaimIds: [],
      })),
      {
        id: `origami-function-phase-${variables.length + 2}`,
        kind: "extract-result",
        expression: input.validation.source.source,
        sourceObjectIds: variables.map(
          (variable) => `origami-function-input-${variable}`,
        ),
        outputObjectIds: ["origami-function-result"],
        proofClaimIds: [],
      },
    ],
    diagnostics: [],
    resultObjectId: "origami-function-result",
  };
};

const animationForPlan = (
  plan: OrigamiFunctionPlan,
  progress = 0,
): OrigamiFoldAnimationState => {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const phaseIndex = Math.min(
    plan.phases.length - 1,
    Math.floor(clampedProgress * plan.phases.length),
  );
  return {
    planId: plan.id,
    phaseId: plan.phases[phaseIndex]?.id ?? plan.phases[0].id,
    progress: clampedProgress,
    playing: false,
    speed: 1,
    reducedMotion: false,
  };
};

export function compileOrigamiFunctionPreview(
  source: string,
  values: Record<string, number> = DEFAULT_ORIGAMI_FUNCTION_VALUES,
): OrigamiFunctionPreview {
  const input = evaluateOrigamiFunctionInput(source, values);
  if (input.status !== "valid") return { status: "blocked", input };
  const plan = createPlan(input);
  return {
    status: "compiled",
    input,
    plan,
    animation: animationForPlan(plan),
    paperStyle: DEFAULT_ORIGAMI_PAPER_STYLE,
  };
}

export function advanceOrigamiFunctionPreview(
  preview: OrigamiFunctionPreview,
  amount = 0.25,
): OrigamiFunctionPreview {
  if (preview.status !== "compiled") return preview;
  return {
    ...preview,
    animation: animationForPlan(
      preview.plan,
      preview.animation.progress + amount,
    ),
  };
}
