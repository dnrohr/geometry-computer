import type { OrigamiObject } from "../../../domain/origami/types";
import type { OrigamiObjectRevealState } from "../../../domain/origami/reveal/evaluateOrigamiReveal";
import type { KeyboardEvent, Ref } from "react";

type SvgOrigamiCanvasProps = {
  objects: OrigamiObject[];
  title: string;
  description?: string;
  viewBox?: string;
  renderStates?: Record<string, OrigamiObjectRevealState>;
  highlightedIds?: Set<string>;
  onSelectObject?: (id: string) => void;
  onHoverObject?: (id?: string) => void;
  svgRef?: Ref<SVGSVGElement>;
};

const longLine = (object: OrigamiObject) => {
  if (object.data.kind !== "line" && object.data.kind !== "crease")
    return undefined;
  const { point, direction } = object.data.line;
  const scale = 20;
  return {
    start: {
      x: point.x - direction.x * scale,
      y: point.y - direction.y * scale,
    },
    end: {
      x: point.x + direction.x * scale,
      y: point.y + direction.y * scale,
    },
  };
};

const objectLabel = (object: OrigamiObject) =>
  `${object.kind} ${object.label ?? object.provenance.expression ?? object.id}`;

const stateStyle = (state?: OrigamiObjectRevealState) => ({
  opacity: state?.dimmed ? 0.25 : (state?.opacity ?? 1),
});

const interactiveProps = (
  object: OrigamiObject,
  onSelectObject?: (id: string) => void,
  onHoverObject?: (id?: string) => void,
) =>
  onSelectObject
    ? {
        role: "button",
        tabIndex: 0,
        "aria-label": objectLabel(object),
        onClick: () => onSelectObject(object.id),
        onMouseOver: () => onHoverObject?.(object.id),
        onMouseOut: () => onHoverObject?.(),
        onKeyDown: (event: KeyboardEvent<SVGElement>) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelectObject(object.id);
          }
        },
      }
    : { "aria-label": objectLabel(object) };

const renderOrigamiObject = (
  object: OrigamiObject,
  state: OrigamiObjectRevealState | undefined,
  onSelectObject?: (id: string) => void,
  onHoverObject?: (id?: string) => void,
) => {
  const visible = state?.visible ?? true;
  const common = {
    id: `origami-${object.id}`,
    className: `origami-object origami-${object.role}`,
    style: {
      ...stateStyle(state),
      opacity: visible ? stateStyle(state).opacity : 0,
    },
    "data-draw-progress": String(state?.drawProgress ?? 1),
    ...interactiveProps(object, onSelectObject, onHoverObject),
  };

  switch (object.data.kind) {
    case "paper-boundary":
      return (
        <polygon
          {...common}
          points={object.data.points
            .map((point) => `${point.x},${point.y}`)
            .join(" ")}
        />
      );
    case "point":
    case "reflected-point":
      return (
        <circle
          {...common}
          cx={object.data.position.x}
          cy={object.data.position.y}
          r="0.09"
        />
      );
    case "segment":
      return (
        <line
          {...common}
          x1={object.data.start.x}
          y1={object.data.start.y}
          x2={object.data.end.x}
          y2={object.data.end.y}
        />
      );
    case "line":
    case "crease": {
      const endpoints = longLine(object)!;
      return (
        <line
          {...common}
          x1={endpoints.start.x}
          y1={endpoints.start.y}
          x2={endpoints.end.x}
          y2={endpoints.end.y}
        />
      );
    }
    case "label":
      return (
        <text {...common} x={object.data.position.x} y={object.data.position.y}>
          {object.data.text}
        </text>
      );
  }
};

export function SvgOrigamiCanvas({
  objects,
  title,
  description,
  viewBox = "0 0 14 10",
  renderStates = {},
  highlightedIds = new Set(),
  onSelectObject,
  onHoverObject,
  svgRef,
}: SvgOrigamiCanvasProps) {
  const titleId = "origami-canvas-title";
  const descriptionId = "origami-canvas-description";
  return (
    <svg
      ref={svgRef}
      className="origami-canvas"
      viewBox={viewBox}
      role="img"
      aria-labelledby={`${titleId} ${descriptionId}`}
    >
      <title id={titleId}>{title}</title>
      <desc id={descriptionId}>
        {description ?? "Flat-origami crease-pattern trace"}
      </desc>
      {objects.map((object) => (
        <g
          key={object.id}
          className={highlightedIds.has(object.id) ? "is-highlighted" : ""}
        >
          {renderOrigamiObject(
            object,
            renderStates[object.id],
            onSelectObject,
            onHoverObject,
          )}
        </g>
      ))}
    </svg>
  );
}
