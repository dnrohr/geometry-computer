import type { OrigamiFunctionPreview } from "./functionPreview";

const width = 300;
const height = 216;
const paperX = 18;
const paperY = 18;
const paperWidth = 264;
const paperHeight = 180;

export function origamiFunctionAnimatedSvg(
  preview: OrigamiFunctionPreview,
): string | undefined {
  if (preview.status !== "compiled") return undefined;
  const phases = preview.plan.phases;
  const duration = Math.max(4, phases.length * 0.7);
  const frameDuration = duration / phases.length;
  const creasePhases = phases.filter(({ foldMotion }) => foldMotion);
  const finalValue = preview.input.validation.value?.toFixed(3) ?? "pending";
  const phaseFrames = phases
    .map((phase, index) => {
      const begin = (index * frameDuration).toFixed(2);
      const next = ((index + 1) * frameDuration).toFixed(2);
      const active = index === 0 ? 1 : 0;
      return [
        `<g class="origami-function-animation-frame" data-frame-phase-id="${escapeXml(phase.id)}" data-frame-phase-kind="${escapeXml(phase.kind)}" data-frame-physical-status="${escapeXml(phase.physicalStatus)}" opacity="${active}">`,
        `<text x="24" y="206">${escapeXml(`${phase.id} ${phase.kind}`)}</text>`,
        `<text x="24" y="44">${escapeXml(phase.expression)}</text>`,
        `<set attributeName="opacity" to="1" begin="${begin}s" dur="${frameDuration.toFixed(2)}s" />`,
        `<set attributeName="opacity" to="0" begin="${next}s" />`,
        "</g>",
      ].join("");
    })
    .join("");
  const creaseLines = creasePhases
    .map((phase, index) => {
      const y = 54 + (phase.foldMotion?.hingeLine.point.y ?? 0) * 12;
      const begin = (
        Math.max(
          0,
          phases.findIndex(({ id }) => id === phase.id),
        ) * frameDuration
      ).toFixed(2);
      return `<line class="origami-function-animated-crease" x1="42" y1="${y.toFixed(2)}" x2="258" y2="${y.toFixed(2)}" data-crease-phase-id="${escapeXml(phase.id)}" data-crease-index="${index + 1}" opacity="0" stroke="${escapeXml(preview.paperStyle.creaseColor)}"><set attributeName="opacity" to="0.85" begin="${begin}s" fill="freeze" /></line>`;
    })
    .join("");

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Origami function animated export: ${escapeXml(preview.plan.source.source)}" viewBox="0 0 ${width} ${height}" data-plan-id="${escapeXml(preview.plan.id)}" data-animation-kind="origami-function-animated-svg" data-phase-count="${phases.length}" data-duration-seconds="${duration.toFixed(2)}">`,
    `<title>Origami function animated export: ${escapeXml(preview.plan.source.source)}</title>`,
    `<desc>${escapeXml(`Animated fold computation for ${preview.plan.source.source}; final sampled result ${finalValue}.`)}</desc>`,
    `<style>
      .origami-function-paper { stroke: #f5f1e8; stroke-width: 1; }
      .origami-function-animated-crease { stroke-linecap: round; stroke-width: 2.6; vector-effect: non-scaling-stroke; }
      .origami-function-animation-frame text { fill: #f6f1df; font: 10px monospace; paint-order: stroke; stroke: #0c1115; stroke-width: 2px; }
      .origami-function-result { fill: #f0b84b; font: 11px monospace; text-anchor: end; }
    </style>`,
    `<rect x="${paperX + 4}" y="${paperY + 5}" width="${paperWidth}" height="${paperHeight}" rx="4" fill="rgba(0,0,0,0.24)" />`,
    `<rect class="origami-function-paper" x="${paperX}" y="${paperY}" width="${paperWidth}" height="${paperHeight}" rx="4" fill="${escapeXml(preview.paperStyle.frontColor)}" opacity="${preview.paperStyle.opacity}" />`,
    creaseLines,
    phaseFrames,
    `<text class="origami-function-result" x="276" y="206">Final ${escapeXml(finalValue)}</text>`,
    "</svg>",
  ].join("");
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
