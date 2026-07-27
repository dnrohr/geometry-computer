import type { OrigamiFunctionPreview } from "./functionPreview";

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
    `paper front=${paperStyle.frontColor} back=${paperStyle.backColor} frontPattern=${paperStyle.frontPattern} backPattern=${paperStyle.backPattern}`,
    "",
    "phases",
    ...plan.phases.map(
      (phase, index) =>
        `${String(index + 1).padStart(2, "0")} ${phase.id} ${phase.kind} status=${phase.physicalStatus} method=${phaseCertificate(phase)} expr="${phase.expression}" outputs=${phase.outputObjectIds.join("|") || "none"}`,
    ),
    "",
  ].join("\n");
}
