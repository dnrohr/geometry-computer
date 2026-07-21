import type { Ref } from "react";
import type { OrigamiFunctionPreview } from "../../../domain/origami/function";

type SvgOrigamiFunctionAnimationProps = {
  preview: OrigamiFunctionPreview;
  snapshotMode?: "animation" | "crease-pattern";
  svgRef?: Ref<SVGSVGElement>;
};

const paperPoints = "18,18 282,18 282,198 18,198";
const stationaryPoints = "18,18 150,18 150,198 18,198";
const movingPoints = "150,18 282,18 282,198 150,198";

const patternId = (pattern: string) => `origami-function-pattern-${pattern}`;
const patternFill = (pattern: string) =>
  pattern === "solid" ? "none" : `url(#${patternId(pattern)})`;
const patternTransform = (scale: number, rotation: number) =>
  `rotate(${rotation}) scale(${scale})`;

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
  snapshotMode = "animation",
  svgRef,
}: SvgOrigamiFunctionAnimationProps) {
  if (preview.status !== "compiled") {
    return (
      <svg
        ref={svgRef}
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
  const movingShadowTransform =
    movingTransform === "none"
      ? "translate(3px, 4px)"
      : `${movingTransform} translate(3px, 4px)`;
  const showBack = motion?.sideExposure.after === "back";
  const showCreasePreview = Boolean(
    motion &&
    (phase.kind === "align-fold" ||
      phase.kind === "preview-crease" ||
      phase.kind === "fold"),
  );
  const activeNode = preview.plan.nodes.find(
    ({ expression }) => expression === phase.expression,
  );
  const activeValue =
    activeNode?.value === undefined ? "pending" : activeNode.value.toFixed(3);
  const finalValue = preview.input.validation.value?.toFixed(3) ?? "pending";
  const paperPatternTransform = patternTransform(
    preview.paperStyle.patternScale,
    preview.paperStyle.patternRotation,
  );
  const isCreasePattern = snapshotMode === "crease-pattern";
  const creasePatternPhases = preview.plan.phases.filter(
    ({ foldMotion }) => foldMotion,
  );

  return (
    <svg
      ref={svgRef}
      className="origami-function-animation"
      role="img"
      aria-label={`Origami function animation: ${preview.plan.source.source}`}
      viewBox="0 0 300 216"
      data-plan-id={preview.plan.id}
      data-phase-id={phase.id}
      data-phase-kind={phase.kind}
      data-physical-status={phase.physicalStatus}
      data-snapshot-mode={snapshotMode}
    >
      <title>
        {isCreasePattern
          ? `Origami function crease pattern: ${preview.plan.source.source}`
          : `Origami function animation: ${preview.plan.source.source}`}
      </title>
      <desc>
        {isCreasePattern
          ? `Final crease pattern with ${creasePatternPhases.length} planned fold creases.`
          : `${phase.id} ${phase.kind} ${phase.expression}`}
      </desc>
      <defs>
        <pattern
          id={patternId("grid")}
          width="16"
          height="16"
          patternUnits="userSpaceOnUse"
          patternTransform={paperPatternTransform}
        >
          <path d="M 16 0 L 0 0 0 16" />
        </pattern>
        <pattern
          id={patternId("dots")}
          width="14"
          height="14"
          patternUnits="userSpaceOnUse"
          patternTransform={paperPatternTransform}
        >
          <circle cx="3" cy="3" r="1.4" />
        </pattern>
        <pattern
          id={patternId("diagonal-stripe")}
          width="12"
          height="12"
          patternUnits="userSpaceOnUse"
          patternTransform={paperPatternTransform}
        >
          <path d="M -3 12 L 12 -3 M 3 15 L 15 3" />
        </pattern>
        <pattern
          id={patternId("washi-wave")}
          width="28"
          height="14"
          patternUnits="userSpaceOnUse"
          patternTransform={paperPatternTransform}
        >
          <path d="M 0 7 C 7 1, 14 13, 21 7 S 35 7, 42 7" />
        </pattern>
        <pattern
          id={patternId("coordinate-grid")}
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
          patternTransform={paperPatternTransform}
        >
          <path d="M 20 0 L 0 0 0 20 M 10 0 L 10 20 M 0 10 L 20 10" />
        </pattern>
        <pattern
          id={patternId("high-contrast")}
          width="10"
          height="10"
          patternUnits="userSpaceOnUse"
          patternTransform={paperPatternTransform}
        >
          <path d="M 0 0 L 10 10 M 10 0 L 0 10" />
        </pattern>
      </defs>
      <polygon className="origami-function-paper-shadow" points={paperPoints} />
      <polygon
        className="origami-function-paper-base"
        points={paperPoints}
        style={{
          fill: preview.paperStyle.frontColor,
          opacity: preview.paperStyle.opacity,
        }}
      />
      <polygon
        className="origami-function-paper-pattern"
        points={paperPoints}
        fill={patternFill(preview.paperStyle.frontPattern)}
        data-pattern-scale={preview.paperStyle.patternScale}
        data-pattern-rotation={preview.paperStyle.patternRotation}
      />
      <polygon
        className="origami-function-paper-stationary"
        points={stationaryPoints}
        data-side="front"
        style={{
          fill: preview.paperStyle.frontColor,
          opacity: preview.paperStyle.opacity,
        }}
      />
      <polyline
        className="origami-function-paper-stationary-edge"
        points={`${stationaryPoints} 18,18`}
      />
      {!isCreasePattern && (
        <>
          <polygon
            className="origami-function-moving-panel-shadow"
            points={movingPoints}
            style={{
              opacity: 0.12 + foldProgress * 0.16,
              transform: movingShadowTransform,
              transformBox: "fill-box",
              transformOrigin: "left center",
            }}
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
              data-side="back"
              style={{
                fill: preview.paperStyle.backColor,
                opacity: (showBack ? 1 : 0.18) * preview.paperStyle.opacity,
              }}
            />
            <polygon
              className="origami-function-paper-front"
              points={movingPoints}
              data-side="front"
              style={{
                fill: preview.paperStyle.frontColor,
                opacity: (showBack ? 0.24 : 1) * preview.paperStyle.opacity,
              }}
            />
            <polygon
              className="origami-function-paper-back-pattern"
              points={movingPoints}
              fill={patternFill(preview.paperStyle.backPattern)}
              data-pattern={preview.paperStyle.backPattern}
              data-pattern-scale={preview.paperStyle.patternScale}
              data-pattern-rotation={preview.paperStyle.patternRotation}
            />
            <polygon
              className="origami-function-paper-front-pattern"
              points={movingPoints}
              fill={patternFill(preview.paperStyle.frontPattern)}
              data-pattern={preview.paperStyle.frontPattern}
              data-pattern-scale={preview.paperStyle.patternScale}
              data-pattern-rotation={preview.paperStyle.patternRotation}
            />
            <polyline
              className="origami-function-paper-back-edge"
              points={`${movingPoints} 150,18`}
            />
            <polyline
              className="origami-function-paper-front-edge"
              points={`${movingPoints} 150,18`}
            />
          </g>
        </>
      )}
      <rect
        className="origami-function-hinge-shadow"
        x="146"
        y="18"
        width="8"
        height="180"
      />
      <rect
        className="origami-function-hinge-highlight"
        x="149"
        y="18"
        width="2"
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
      {showCreasePreview && !isCreasePattern && (
        <>
          <line
            className="origami-function-crease-underlay"
            x1="58"
            y1={72 + (motion?.hingeLine.point.y ?? 0) * 10}
            x2="242"
            y2={72 + (motion?.hingeLine.point.y ?? 0) * 10}
          />
          <line
            className="origami-function-crease-preview"
            x1="58"
            y1={72 + (motion?.hingeLine.point.y ?? 0) * 10}
            x2="242"
            y2={72 + (motion?.hingeLine.point.y ?? 0) * 10}
            style={{ stroke: preview.paperStyle.creaseColor }}
          />
        </>
      )}
      {motion && !isCreasePattern && (
        <>
          <line
            className="origami-function-active-crease-underlay"
            x1="42"
            y1={54 + motion.hingeLine.point.y * 12}
            x2="258"
            y2={54 + motion.hingeLine.point.y * 12}
          />
          <line
            className="origami-function-active-crease"
            x1="42"
            y1={54 + motion.hingeLine.point.y * 12}
            x2="258"
            y2={54 + motion.hingeLine.point.y * 12}
            style={{ stroke: preview.paperStyle.highlightColor }}
          />
        </>
      )}
      {isCreasePattern && (
        <g
          className="origami-function-crease-pattern"
          aria-label="Final function crease pattern"
        >
          {creasePatternPhases.map((creasePhase, index) => (
            <line
              key={creasePhase.id}
              className="origami-function-crease-pattern-line"
              x1="42"
              y1={54 + (creasePhase.foldMotion?.hingeLine.point.y ?? 0) * 12}
              x2="258"
              y2={54 + (creasePhase.foldMotion?.hingeLine.point.y ?? 0) * 12}
              data-crease-phase-id={creasePhase.id}
              data-crease-index={index + 1}
              style={{ stroke: preview.paperStyle.creaseColor }}
            />
          ))}
        </g>
      )}
      <text className="origami-function-animation-phase" x="24" y="208">
        {`${phase.id} ${phase.kind}`}
      </text>
      <text className="origami-function-animation-value" x="276" y="208">
        {finalValue}
      </text>
      <g
        className="origami-function-value-strip"
        aria-label="Function animation value readout"
      >
        <rect x="24" y="24" width="252" height="34" rx="4" />
        <text x="34" y="45">{`Current ${phase.expression}`}</text>
        <text x="186" y="45">{`Value ${activeValue}`}</text>
        <text x="266" y="45">{`Final ${finalValue}`}</text>
      </g>
    </svg>
  );
}
