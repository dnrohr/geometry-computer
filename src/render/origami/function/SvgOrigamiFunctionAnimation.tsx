import type { OrigamiFunctionPreview } from "../../../domain/origami/function";

type SvgOrigamiFunctionAnimationProps = {
  preview: OrigamiFunctionPreview;
};

const paperPoints = "18,18 282,18 282,198 18,198";
const stationaryPoints = "18,18 150,18 150,198 18,198";
const movingPoints = "150,18 282,18 282,198 150,198";

const phaseLabel = (
  preview: Extract<OrigamiFunctionPreview, { status: "compiled" }>,
) => {
  const phase = preview.plan.phases.find(
    ({ id }) => id === preview.animation.phaseId,
  );
  return phase ?? preview.plan.phases[0];
};

export function SvgOrigamiFunctionAnimation({
  preview,
}: SvgOrigamiFunctionAnimationProps) {
  if (preview.status !== "compiled") {
    return (
      <svg
        className="origami-function-animation"
        role="img"
        aria-label="Origami function animation unavailable"
        viewBox="0 0 300 216"
      >
        <title>Origami function animation unavailable</title>
        <rect x="18" y="18" width="264" height="180" rx="4" />
        <text x="150" y="108">
          Compile an allowable function
        </text>
      </svg>
    );
  }

  const phase = phaseLabel(preview);
  const motion = phase.foldMotion;
  const foldProgress =
    phase.kind === "fold" || phase.kind === "transfer"
      ? preview.animation.progress
      : phase.kind === "preview-crease"
        ? 0.18
        : 0;
  const directionSign = motion?.direction === "valley" ? -1 : 1;
  const movingTransform = motion
    ? `rotate(${directionSign * foldProgress * 18}deg) skewY(${directionSign * foldProgress * 5}deg)`
    : "none";
  const showBack = motion?.sideExposure.after === "back";
  const showCreasePreview = Boolean(
    motion &&
    (phase.kind === "align-fold" ||
      phase.kind === "preview-crease" ||
      phase.kind === "fold"),
  );

  return (
    <svg
      className="origami-function-animation"
      role="img"
      aria-label={`Origami function animation: ${preview.plan.source.source}`}
      viewBox="0 0 300 216"
    >
      <title>{`Origami function animation: ${preview.plan.source.source}`}</title>
      <desc>{`${phase.id} ${phase.kind} ${phase.expression}`}</desc>
      <defs>
        <pattern
          id="origami-function-animation-grid"
          width="16"
          height="16"
          patternUnits="userSpaceOnUse"
        >
          <path d="M 16 0 L 0 0 0 16" />
        </pattern>
      </defs>
      <polygon className="origami-function-paper-shadow" points={paperPoints} />
      <polygon
        className="origami-function-paper-base"
        points={paperPoints}
        style={{ fill: preview.paperStyle.frontColor }}
      />
      <polygon
        className="origami-function-paper-pattern"
        points={paperPoints}
        fill="url(#origami-function-animation-grid)"
      />
      <polygon
        className="origami-function-paper-stationary"
        points={stationaryPoints}
        style={{ fill: preview.paperStyle.frontColor }}
      />
      <g
        className="origami-function-moving-panel"
        style={{
          transform: movingTransform,
          transformBox: "fill-box",
          transformOrigin: "left center",
        }}
      >
        <polygon
          className="origami-function-paper-back"
          points={movingPoints}
          style={{
            fill: preview.paperStyle.backColor,
            opacity: showBack ? 1 : 0.18,
          }}
        />
        <polygon
          className="origami-function-paper-front"
          points={movingPoints}
          style={{
            fill: preview.paperStyle.frontColor,
            opacity: showBack ? 0.24 : 1,
          }}
        />
        <polygon
          className="origami-function-paper-moving-pattern"
          points={movingPoints}
          fill="url(#origami-function-animation-grid)"
        />
      </g>
      <rect
        className="origami-function-hinge-shadow"
        x="146"
        y="18"
        width="8"
        height="180"
      />
      <line
        className="origami-function-hinge"
        x1="150"
        y1="18"
        x2="150"
        y2="198"
        style={{ stroke: preview.paperStyle.creaseColor }}
      />
      {showCreasePreview && (
        <line
          className="origami-function-crease-preview"
          x1="58"
          y1={72 + (motion?.hingeLine.point.y ?? 0) * 10}
          x2="242"
          y2={72 + (motion?.hingeLine.point.y ?? 0) * 10}
          style={{ stroke: preview.paperStyle.creaseColor }}
        />
      )}
      {motion && (
        <line
          className="origami-function-active-crease"
          x1="42"
          y1={54 + motion.hingeLine.point.y * 12}
          x2="258"
          y2={54 + motion.hingeLine.point.y * 12}
          style={{ stroke: preview.paperStyle.highlightColor }}
        />
      )}
      <text className="origami-function-animation-phase" x="24" y="208">
        {`${phase.id} ${phase.kind}`}
      </text>
      <text className="origami-function-animation-value" x="276" y="208">
        {preview.input.validation.value?.toFixed(3)}
      </text>
    </svg>
  );
}
