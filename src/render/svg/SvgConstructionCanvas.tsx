import type { GeomObject } from "../../domain/geometry/types";
import { renderObject } from "./renderObject";
import type { ObjectRevealState } from "../../domain/reveal/evaluateReveal";

type SvgConstructionCanvasProps = {
  objects: GeomObject[];
  viewBox?: string;
  title: string;
  description?: string;
  renderStates?: Record<string, ObjectRevealState>;
  highlightedIds?: Set<string>;
  scaffoldMode?: "all" | "current" | "hide-retired";
  activeStepId?: string;
  onSelectObject?: (id: string) => void;
  onHoverObject?: (id?: string) => void;
  svgRef?: React.Ref<SVGSVGElement>;
};

export function SvgConstructionCanvas({
  objects,
  viewBox = "0 0 760 480",
  title,
  description,
  renderStates = {},
  highlightedIds = new Set(),
  scaffoldMode = "all",
  activeStepId,
  onSelectObject,
  onHoverObject,
  svgRef,
}: SvgConstructionCanvasProps) {
  const titleId = "construction-canvas-title";
  const descriptionId = "construction-canvas-description";
  return (
    <svg
      ref={svgRef}
      className="construction-canvas"
      viewBox={viewBox}
      role="img"
      aria-labelledby={`${titleId} ${descriptionId}`}
    >
      <title id={titleId}>{title}</title>
      <desc id={descriptionId}>
        {description ?? "Static compass-and-straightedge construction scene"}
      </desc>
      <style>{`.geometry-object{vector-effect:non-scaling-stroke}.geometry-result{stroke:#f0b84b;stroke-width:4}.geometry-scaffold{stroke-dasharray:7 6;opacity:.55}`}</style>
      {objects.map((object) => {
        const state = renderStates[object.id];
        const scaffoldVisible =
          object.role !== "scaffold" ||
          scaffoldMode === "all" ||
          (scaffoldMode === "current" &&
            object.createdByStepId === activeStepId);
        return (
          <g
            key={object.id}
            className={highlightedIds.has(object.id) ? "is-highlighted" : ""}
          >
            {renderObject(object, {
              drawProgress: state?.drawProgress ?? 1,
              visible: (state?.visible ?? true) && scaffoldVisible,
              dimmed: state?.dimmed,
              highlighted: highlightedIds.has(object.id),
              interactive: Boolean(onSelectObject),
              onSelect: onSelectObject,
              onHover: onHoverObject,
            })}
          </g>
        );
      })}
    </svg>
  );
}
