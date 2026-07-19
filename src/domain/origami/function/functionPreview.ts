import {
  DEFAULT_ORIGAMI_FUNCTION_VALUES,
  evaluateOrigamiFunctionInput,
} from "./functionInput";
import { createOrigamiFunctionPlan } from "./functionPlan";
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
  const plan = createOrigamiFunctionPlan(input);
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

export function setOrigamiFunctionPreviewProgress(
  preview: OrigamiFunctionPreview,
  progress: number,
): OrigamiFunctionPreview {
  if (preview.status !== "compiled") return preview;
  return {
    ...preview,
    animation: animationForPlan(preview.plan, progress),
  };
}

export function stepOrigamiFunctionPreviewPhase(
  preview: OrigamiFunctionPreview,
  delta: number,
): OrigamiFunctionPreview {
  if (preview.status !== "compiled") return preview;
  const currentIndex = preview.plan.phases.findIndex(
    ({ id }) => id === preview.animation.phaseId,
  );
  const nextIndex = Math.max(
    0,
    Math.min(
      preview.plan.phases.length - 1,
      (currentIndex < 0 ? 0 : currentIndex) + delta,
    ),
  );
  return {
    ...preview,
    animation: animationForPlan(
      preview.plan,
      nextIndex === preview.plan.phases.length - 1
        ? 1
        : nextIndex / preview.plan.phases.length,
    ),
  };
}

export function setOrigamiFunctionPreviewPlaying(
  preview: OrigamiFunctionPreview,
  playing: boolean,
): OrigamiFunctionPreview {
  if (preview.status !== "compiled") return preview;
  return {
    ...preview,
    animation: { ...preview.animation, playing },
  };
}

export function setOrigamiFunctionPreviewSpeed(
  preview: OrigamiFunctionPreview,
  speed: number,
): OrigamiFunctionPreview {
  if (preview.status !== "compiled") return preview;
  return {
    ...preview,
    animation: {
      ...preview.animation,
      speed: Math.max(0.25, Math.min(4, Number.isFinite(speed) ? speed : 1)),
    },
  };
}

export function setOrigamiFunctionPreviewReducedMotion(
  preview: OrigamiFunctionPreview,
  reducedMotion: boolean,
): OrigamiFunctionPreview {
  if (preview.status !== "compiled") return preview;
  return {
    ...preview,
    animation: {
      ...preview.animation,
      reducedMotion,
      playing: reducedMotion ? false : preview.animation.playing,
    },
  };
}
