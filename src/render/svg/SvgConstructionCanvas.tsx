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
  expressionSummary?: string;
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
  expressionSummary,
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
      data-expression={expressionSummary}
    >
      <title id={titleId}>{title}</title>
      <desc id={descriptionId}>
        {description ?? "Static compass-and-straightedge construction scene"}
      </desc>
      <style>{`.geometry-object{fill:none;stroke:#91a0aa;stroke-width:2;vector-effect:non-scaling-stroke}.geometry-object text,text.geometry-object{fill:#c7cdd1;stroke:none;font:14px monospace;text-anchor:middle}.geometry-object circle{fill:#eef1f2;stroke:none}.geometry-input{stroke:#8dc5d6}.geometry-unit{stroke:#d8d8d0}.geometry-scaffold{stroke:#91a0aa;stroke-dasharray:7 6;opacity:.55}.geometry-intermediate{stroke:#ad91d3;stroke-width:3}.geometry-active-construction,.geometry-proof-highlight{stroke:#e7d28c;stroke-width:3}.geometry-result{stroke:#f0b84b;stroke-width:4}.geometry-ghost{opacity:.35;stroke-dasharray:3 4}.is-highlighted .geometry-object:not(text){opacity:1;stroke:#fff2bb;stroke-width:5}.is-highlighted text.geometry-object{fill:#fff2bb;stroke:none}`}</style>
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
              opacity: state?.opacity,
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
