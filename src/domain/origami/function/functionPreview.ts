import {
  DEFAULT_ORIGAMI_FUNCTION_VALUES,
  evaluateOrigamiFunctionInput,
} from "./functionInput";
import { createOrigamiFunctionPlan } from "./functionPlan";
import type {
  OrigamiFoldAnimationState,
  OrigamiFunctionAnimationActivePhase,
  OrigamiFunctionAnimationExport,
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

export type OrigamiFunctionAnimationReplay =
  | {
      status: "replayed";
      preview: Extract<OrigamiFunctionPreview, { status: "compiled" }>;
      source: string;
      values: Record<string, number>;
    }
  | {
      status: "error";
      error: string;
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

export function setOrigamiFunctionPreviewPhase(
  preview: OrigamiFunctionPreview,
  phaseId: string,
): OrigamiFunctionPreview {
  if (preview.status !== "compiled") return preview;
  const phaseIndex = preview.plan.phases.findIndex(({ id }) => id === phaseId);
  if (phaseIndex < 0) return preview;
  return {
    ...preview,
    animation: animationForPlan(
      preview.plan,
      phaseIndex === preview.plan.phases.length - 1
        ? 1
        : phaseIndex / preview.plan.phases.length,
    ),
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

export function setOrigamiFunctionPreviewPaperStyle(
  preview: OrigamiFunctionPreview,
  paperStyle: Partial<OrigamiPaperStyle>,
): OrigamiFunctionPreview {
  if (preview.status !== "compiled") return preview;
  const nextOpacity = paperStyle.opacity ?? preview.paperStyle.opacity;
  const nextPatternScale =
    paperStyle.patternScale ?? preview.paperStyle.patternScale;
  const nextPatternRotation =
    paperStyle.patternRotation ?? preview.paperStyle.patternRotation;
  return {
    ...preview,
    paperStyle: {
      ...preview.paperStyle,
      ...paperStyle,
      opacity: Math.max(
        0.2,
        Math.min(
          1,
          Number.isFinite(nextOpacity)
            ? nextOpacity
            : preview.paperStyle.opacity,
        ),
      ),
      patternScale: Math.max(
        0.5,
        Math.min(
          3,
          Number.isFinite(nextPatternScale)
            ? nextPatternScale
            : preview.paperStyle.patternScale,
        ),
      ),
      patternRotation: Math.max(
        0,
        Math.min(
          360,
          Number.isFinite(nextPatternRotation)
            ? nextPatternRotation
            : preview.paperStyle.patternRotation,
        ),
      ),
    },
  };
}

export function origamiFunctionAnimationExport(
  preview: OrigamiFunctionPreview,
  exportedAt?: string,
): OrigamiFunctionAnimationExport | undefined {
  if (preview.status !== "compiled") return undefined;
  const activePhase = activePhaseForExport(preview);
  return {
    version: 1,
    plan: preview.plan,
    animation: preview.animation,
    activePhase,
    solverReadiness: preview.plan.solverReadiness,
    paperStyle: preview.paperStyle,
    ...(exportedAt ? { exportedAt } : {}),
  };
}

function activePhaseForExport(
  preview: Extract<OrigamiFunctionPreview, { status: "compiled" }>,
): OrigamiFunctionAnimationActivePhase {
  const phase =
    preview.plan.phases.find(({ id }) => id === preview.animation.phaseId) ??
    preview.plan.phases[0];
  const solverWorkItem = preview.plan.solverReadiness.workItems.find(
    ({ phaseId }) => phaseId === phase.id,
  );
  return {
    phaseId: phase.id,
    phaseKind: phase.kind,
    expression: phase.expression,
    physicalStatus: phase.physicalStatus,
    ...(phase.foldCertificate
      ? { foldCertificate: phase.foldCertificate }
      : {}),
    ...(solverWorkItem ? { solverWorkItem } : {}),
  };
}

export const origamiFunctionAnimationJson = (
  preview: OrigamiFunctionPreview,
  exportedAt?: string,
) =>
  JSON.stringify(origamiFunctionAnimationExport(preview, exportedAt), null, 2);

export function replayOrigamiFunctionAnimationExport(
  exported: unknown,
): OrigamiFunctionAnimationReplay {
  if (!isRecord(exported) || exported.version !== 1) {
    return { status: "error", error: "Import must be a version 1 animation." };
  }
  if (!isRecord(exported.plan) || !isRecord(exported.plan.source)) {
    return { status: "error", error: "Import is missing its function source." };
  }
  const source = exported.plan.source.source;
  if (typeof source !== "string" || !source.trim()) {
    return { status: "error", error: "Import has an invalid function source." };
  }
  const values = numericRecord(exported.plan.values);
  if (!values) {
    return { status: "error", error: "Import has invalid sample values." };
  }
  if (!isRecord(exported.animation)) {
    return {
      status: "error",
      error: "Import is missing animation timeline state.",
    };
  }
  const phaseId = exported.animation.phaseId;
  if (typeof phaseId !== "string") {
    return { status: "error", error: "Import has an invalid animation phase." };
  }
  const compiled = compileOrigamiFunctionPreview(source, values);
  if (compiled.status !== "compiled") {
    return {
      status: "error",
      error: "Imported function is outside the sampled origami domain.",
    };
  }
  if (
    typeof exported.animation.planId === "string" &&
    exported.animation.planId !== compiled.plan.id
  ) {
    return {
      status: "error",
      error: "Import plan ID does not match the recompiled function.",
    };
  }
  if (!compiled.plan.phases.some(({ id }) => id === phaseId)) {
    return { status: "error", error: "Import references an unknown phase." };
  }
  const styled = isRecord(exported.paperStyle)
    ? setOrigamiFunctionPreviewPaperStyle(compiled, exported.paperStyle)
    : compiled;
  if (styled.status !== "compiled") {
    return {
      status: "error",
      error: "Imported function could not restore paper style.",
    };
  }
  const phased = setOrigamiFunctionPreviewPhase(styled, phaseId);
  if (phased.status !== "compiled") {
    return { status: "error", error: "Imported phase could not be replayed." };
  }
  return {
    status: "replayed",
    preview: {
      ...phased,
      animation: {
        ...phased.animation,
        playing: false,
        reducedMotion:
          typeof exported.animation.reducedMotion === "boolean"
            ? exported.animation.reducedMotion
            : phased.animation.reducedMotion,
        speed:
          typeof exported.animation.speed === "number"
            ? Math.max(0.25, Math.min(4, exported.animation.speed))
            : phased.animation.speed,
      },
    },
    source,
    values,
  };
}

export function replayOrigamiFunctionAnimationJson(
  json: string,
): OrigamiFunctionAnimationReplay {
  try {
    return replayOrigamiFunctionAnimationExport(JSON.parse(json));
  } catch {
    return { status: "error", error: "Import must be valid JSON." };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function numericRecord(value: unknown): Record<string, number> | undefined {
  if (!isRecord(value)) return undefined;
  const entries = Object.entries(value);
  if (
    entries.some(
      ([key, item]) =>
        !key || typeof item !== "number" || !Number.isFinite(item),
    )
  ) {
    return undefined;
  }
  return Object.fromEntries(entries) as Record<string, number>;
}
