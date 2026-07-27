import {
  compileOrigamiFunctionPreview,
  setOrigamiFunctionPreviewPaperStyle,
  setOrigamiFunctionPreviewPhase,
  type OrigamiFunctionAnimationReplay,
  type OrigamiFunctionPreview,
} from "./functionPreview";
import type { OrigamiPaperStyle } from "./types";

const formatValues = (values: Record<string, number>) =>
  Object.entries(values)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => `${name}=${value}`)
    .join(", ");

const phaseCertificate = (
  phase: Extract<
    OrigamiFunctionPreview,
    { status: "compiled" }
  >["plan"]["phases"][number],
) => phase.foldCertificate?.method ?? "solver-work";

export function origamiFunctionScript(
  preview: OrigamiFunctionPreview,
): string | undefined {
  if (preview.status !== "compiled") return undefined;
  const { plan, animation, paperStyle } = preview;
  const resultNode = plan.nodes.find(
    (node) => node.id === plan.resultExtraction.nodeId,
  );
  const resultValue = resultNode?.value ?? Number.NaN;
  return [
    "# Geometry Computer origami function script v1",
    `function ${plan.source.source}`,
    `samples ${formatValues(plan.values)}`,
    `result ${plan.source.source} = ${resultValue.toFixed(6)}`,
    `solver ${plan.solverReadiness.status} certified=${plan.solverReadiness.certifiedPhases}/${plan.solverReadiness.totalPhases}`,
    `active ${animation.phaseId} progress=${animation.progress.toFixed(2)}`,
    `paper front=${paperStyle.frontColor} back=${paperStyle.backColor} frontPattern=${paperStyle.frontPattern} backPattern=${paperStyle.backPattern} crease=${paperStyle.creaseColor} highlight=${paperStyle.highlightColor} opacity=${paperStyle.opacity} scale=${paperStyle.patternScale} rotation=${paperStyle.patternRotation}`,
    "",
    "phases",
    ...plan.phases.map(
      (phase, index) =>
        `${String(index + 1).padStart(2, "0")} ${phase.id} ${phase.kind} status=${phase.physicalStatus} method=${phaseCertificate(phase)} expr="${phase.expression}" outputs=${phase.outputObjectIds.join("|") || "none"}`,
    ),
    "",
  ].join("\n");
}

const lineValue = (lines: string[], prefix: string) =>
  lines
    .find((line) => line.startsWith(prefix))
    ?.slice(prefix.length)
    .trim();

const parseValues = (source: string): Record<string, number> | undefined => {
  if (!source) return {};
  return source
    .split(",")
    .reduce<Record<string, number> | undefined>((values, part) => {
      if (!values) return undefined;
      const [rawName, rawValue] = part.split("=");
      const name = rawName?.trim();
      const value = Number(rawValue?.trim());
      if (!name || !Number.isFinite(value)) return undefined;
      values[name] = value;
      return values;
    }, {});
};

const parsePairs = (source: string) =>
  Object.fromEntries(
    source
      .split(/\s+/)
      .map((part) => part.split("="))
      .filter(
        (part): part is [string, string] =>
          part.length === 2 && Boolean(part[0]) && Boolean(part[1]),
      ),
  );

const parsePaperStyle = (
  source: string | undefined,
): Partial<OrigamiPaperStyle> => {
  if (!source) return {};
  const pairs = parsePairs(source);
  const numberPair = (name: string) => {
    const value = Number(pairs[name]);
    return Number.isFinite(value) ? value : undefined;
  };
  return {
    ...(pairs.front ? { frontColor: pairs.front } : {}),
    ...(pairs.back ? { backColor: pairs.back } : {}),
    ...(pairs.frontPattern
      ? {
          frontPattern: pairs.frontPattern as OrigamiPaperStyle["frontPattern"],
        }
      : {}),
    ...(pairs.backPattern
      ? { backPattern: pairs.backPattern as OrigamiPaperStyle["backPattern"] }
      : {}),
    ...(pairs.crease ? { creaseColor: pairs.crease } : {}),
    ...(pairs.highlight ? { highlightColor: pairs.highlight } : {}),
    ...(numberPair("opacity") !== undefined
      ? { opacity: numberPair("opacity") }
      : {}),
    ...(numberPair("scale") !== undefined
      ? { patternScale: numberPair("scale") }
      : {}),
    ...(numberPair("rotation") !== undefined
      ? { patternRotation: numberPair("rotation") }
      : {}),
  };
};

export function replayOrigamiFunctionScript(
  script: string,
): OrigamiFunctionAnimationReplay {
  const lines = script
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines[0] !== "# Geometry Computer origami function script v1") {
    return {
      status: "error",
      error: "Import must be a version 1 function script.",
    };
  }
  const source = lineValue(lines, "function ");
  if (!source) {
    return { status: "error", error: "Import script is missing its function." };
  }
  const values = parseValues(lineValue(lines, "samples ") ?? "");
  if (!values) {
    return {
      status: "error",
      error: "Import script has invalid sample values.",
    };
  }
  const active = parsePairs(lineValue(lines, "active ") ?? "");
  const phaseId = lineValue(lines, "active ")?.split(/\s+/)[0];
  if (!phaseId) {
    return {
      status: "error",
      error: "Import script is missing its active phase.",
    };
  }
  const compiled = compileOrigamiFunctionPreview(source, values);
  if (compiled.status !== "compiled") {
    return {
      status: "error",
      error: "Imported script function is outside the sampled origami domain.",
    };
  }
  if (!compiled.plan.phases.some(({ id }) => id === phaseId)) {
    return {
      status: "error",
      error: "Import script references an unknown phase.",
    };
  }
  const styled = setOrigamiFunctionPreviewPaperStyle(
    compiled,
    parsePaperStyle(lineValue(lines, "paper ")),
  );
  const phased = setOrigamiFunctionPreviewPhase(styled, phaseId);
  if (phased.status !== "compiled") {
    return {
      status: "error",
      error: "Imported script phase could not be replayed.",
    };
  }
  const progress = Number(active.progress);
  return {
    status: "replayed",
    preview: {
      ...phased,
      animation: {
        ...phased.animation,
        progress: Number.isFinite(progress)
          ? Math.max(0, Math.min(1, progress))
          : phased.animation.progress,
        playing: false,
      },
    },
    source,
    values,
  };
}
