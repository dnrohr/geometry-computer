import type { Ref } from "react";
import type { OrigamiFunctionPreview } from "../../../domain/origami/function";

export type OrigamiFunctionCameraMode =
  | "whole"
  | "paper"
  | "active-fold"
  | "result";

export type OrigamiFunctionAnimationWarning = {
  id: string;
  label: string;
  detail: string;
  tone: "info" | "warning";
};

type SvgOrigamiFunctionAnimationProps = {
  cameraMode?: OrigamiFunctionCameraMode;
  highlightedPhaseId?: string;
  onionSkin?: boolean;
  onPhaseHover?: (phaseId?: string) => void;
  phaseWarnings?: readonly OrigamiFunctionAnimationWarning[];
  preview: OrigamiFunctionPreview;
  snapshotMode?: "animation" | "crease-pattern";
  svgRef?: Ref<SVGSVGElement>;
};

const paperPoints = "60,18 240,18 240,198 60,198";
const stationaryPoints = "60,108 240,108 240,198 60,198";
const movingPoints = "60,18 240,18 240,108 60,108";

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
  cameraMode = "whole",
  highlightedPhaseId,
  onionSkin = false,
  onPhaseHover,
  phaseWarnings = [],
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
        viewBox="0 0 300 240"
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
    ? `translateY(${directionSign * foldProgress * 7}px) rotate(${directionSign * foldProgress * -16}deg) skewX(${directionSign * foldProgress * 5}deg)`
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
  const phaseIndex = preview.plan.phases.findIndex(({ id }) => id === phase.id);
  const onionSkinPhases = onionSkin
    ? [
        nearestMotionPhase(preview, phaseIndex, -1),
        nearestMotionPhase(preview, phaseIndex, 1),
      ].filter((item): item is NonNullable<typeof item> => Boolean(item))
    : [];
  const viewBox = viewBoxForCamera(cameraMode, isCreasePattern);
  const activePhaseIsHighlighted = highlightedPhaseId === phase.id;

  return (
    <svg
      ref={svgRef}
      className="origami-function-animation"
      role="img"
      aria-label={`Origami function animation: ${preview.plan.source.source}`}
      viewBox={viewBox}
      data-plan-id={preview.plan.id}
      data-phase-id={phase.id}
      data-phase-kind={phase.kind}
      data-physical-status={phase.physicalStatus}
      data-snapshot-mode={snapshotMode}
      data-camera-mode={cameraMode}
      data-paper-shape="square"
      data-highlighted-phase-id={highlightedPhaseId}
      data-warning-count={phaseWarnings.length}
      data-dependency-highlight={
        activePhaseIsHighlighted ? "active-phase" : undefined
      }
      onMouseEnter={() => onPhaseHover?.(phase.id)}
      onMouseLeave={() => onPhaseHover?.(undefined)}
      onFocus={() => onPhaseHover?.(phase.id)}
      onBlur={() => onPhaseHover?.(undefined)}
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
        data-paper-shape="square"
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
              transformOrigin: "center bottom",
            }}
          />
          <g
            className="origami-function-moving-panel"
            style={{
              transform: movingTransform,
              transformBox: "fill-box",
              transformOrigin: "center bottom",
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
        x="60"
        y="104"
        width="180"
        height="8"
      />
      <rect
        className="origami-function-hinge-highlight"
        x="60"
        y="107"
        width="180"
        height="2"
      />
      <line
        className="origami-function-hinge"
        x1="60"
        y1="108"
        x2="240"
        y2="108"
        style={{ stroke: preview.paperStyle.creaseColor }}
      />
      {!isCreasePattern && (
        <g
          className="origami-function-planned-creases"
          aria-label="Planned fold creases"
        >
          {creasePatternPhases.slice(0, 6).map((creasePhase, index) => (
            <line
              key={creasePhase.id}
              className="origami-function-planned-crease"
              x1={76 + index * 3}
              y1={62 + (creasePhase.foldMotion?.hingeLine.point.y ?? 0) * 12}
              x2={224 - index * 2}
              y2={62 + (creasePhase.foldMotion?.hingeLine.point.y ?? 0) * 12}
              data-crease-phase-id={creasePhase.id}
              data-dependency-highlight={
                highlightedPhaseId === creasePhase.id ? "crease" : undefined
              }
              onMouseEnter={() => onPhaseHover?.(creasePhase.id)}
              onMouseLeave={() => onPhaseHover?.(undefined)}
              style={{ stroke: preview.paperStyle.creaseColor }}
            />
          ))}
        </g>
      )}
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
            data-dependency-highlight={
              activePhaseIsHighlighted ? "active-crease" : undefined
            }
          />
        </>
      )}
      {onionSkinPhases.length > 0 && !isCreasePattern && (
        <g
          className="origami-function-onion-skin"
          aria-label="Neighboring fold ghosts"
        >
          {onionSkinPhases.map(({ phase: ghostPhase, relation }) => (
            <line
              key={`${relation}-${ghostPhase.id}`}
              className={`origami-function-onion-skin-crease origami-function-onion-skin-crease-${relation}`}
              x1="44"
              y1={54 + (ghostPhase.foldMotion?.hingeLine.point.y ?? 0) * 12}
              x2="256"
              y2={54 + (ghostPhase.foldMotion?.hingeLine.point.y ?? 0) * 12}
              data-onion-skin={relation}
              data-onion-phase-id={ghostPhase.id}
            />
          ))}
        </g>
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
      <text className="origami-function-animation-phase" x="48" y="202">
        {`${phase.id} ${phase.kind}`}
      </text>
      <text className="origami-function-animation-value" x="252" y="202">
        {finalValue}
      </text>
      {phaseWarnings.length > 0 && !isCreasePattern && (
        <g
          className="origami-function-animation-warnings"
          aria-label="Function animation warnings"
        >
          {phaseWarnings.slice(0, 3).map((warning, index) => (
            <g
              key={warning.id}
              className={`origami-function-animation-warning origami-function-animation-warning-${warning.tone}`}
              data-warning-id={warning.id}
              data-warning-tone={warning.tone}
              transform={`translate(58 ${24 + index * 22})`}
            >
              <title>{`${warning.label}: ${warning.detail}`}</title>
              <rect width="118" height="16" rx="4" />
              <text x="7" y="11">
                {warning.label}
              </text>
            </g>
          ))}
        </g>
      )}
      <g
        className="origami-function-value-strip"
        aria-label="Function animation value readout"
        data-readout-placement="below-paper"
      >
        <rect x="48" y="206" width="204" height="28" rx="4" />
        <text x="58" y="224">{`Current ${phase.expression}`}</text>
        <text x="176" y="224">{`Value ${activeValue}`}</text>
        <text x="242" y="224">{`Final ${finalValue}`}</text>
      </g>
    </svg>
  );
}

function viewBoxForCamera(
  cameraMode: OrigamiFunctionCameraMode,
  isCreasePattern: boolean,
) {
  if (isCreasePattern) return "0 0 300 240";
  if (cameraMode === "paper") return "48 12 204 192";
  if (cameraMode === "active-fold") return "54 36 192 132";
  if (cameraMode === "result") return "146 132 112 78";
  return "0 0 300 240";
}

function nearestMotionPhase(
  preview: Extract<OrigamiFunctionPreview, { status: "compiled" }>,
  fromIndex: number,
  direction: -1 | 1,
) {
  for (
    let index = fromIndex + direction;
    index >= 0 && index < preview.plan.phases.length;
    index += direction
  ) {
    const phase = preview.plan.phases[index];
    if (phase.foldMotion) {
      return {
        phase,
        relation: direction < 0 ? "previous" : "next",
      } as const;
    }
  }
  return undefined;
}
