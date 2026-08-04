import { useMemo, useState } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import type { RenderDocumentV2, RenderObject } from "../../domain/render/types";
import type { Point2 } from "../../domain/geometry/types";
import { evaluateOrigamiTimeline } from "../../domain/origami/timeline";

const colors: Record<string, string> = {
  paper: "#f3ead3", crease: "#ed765e", result: "#63c5da",
  "proof-highlight": "#f0b45d", reference: "#89a7c2", input: "#89a7c2",
};

type Props = {
  document: RenderDocumentV2;
  time: number;
  selectedId?: string;
  highlightedIds?: ReadonlySet<string>;
  onSelect?: (id: string) => void;
  onPaperPoint?: (point: Point2) => void;
};

const objectName = (object: RenderObject) =>
  `${object.role} ${object.kind} ${object.label ?? object.id}`;

export function OrigamiCanvas({ document, time, selectedId, highlightedIds, onSelect, onPaperPoint }: Props) {
  const [hoveredId, setHoveredId] = useState<string>();
  const timeline = useMemo(() => evaluateOrigamiTimeline(document, time), [document, time]);
  const movingIds = useMemo(() => new Set(document.revealActions.filter(({ animation }) => animation === "fold" || animation === "unfold").map(({ objectId }) => objectId)), [document]);
  const ordered = [...document.objects].sort((a, b) => (timeline[a.id].layer ?? 0) - (timeline[b.id].layer ?? 0));
  const activate = (id: string) => onSelect?.(id);
  const keyboardActivate = (event: KeyboardEvent<SVGGElement>, id: string) => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); activate(id); }
  };
  const className = (object: RenderObject) => [
    "origami-object", movingIds.has(object.id) ? "moving" : object.kind === "polygon" ? "stationary" : "annotation",
    selectedId === object.id ? "selected" : "", hoveredId === object.id ? "hovered" : "",
    highlightedIds?.has(object.id) ? "trace-highlighted" : "",
    timeline[object.id].folding ? "folding" : "",
  ].filter(Boolean).join(" ");

  const pickPaperPoint = (event: MouseEvent<SVGSVGElement>) => {
    if (!onPaperPoint) return;
    const [x, y, width, height] = document.viewBox.split(/\s+/).map(Number);
    const bounds = event.currentTarget.getBoundingClientRect();
    onPaperPoint({ x: x + (event.clientX - bounds.left) / bounds.width * width, y: y + (event.clientY - bounds.top) / bounds.height * height });
  };
  return <svg className="origami-canvas" viewBox={document.viewBox} role="img" aria-label={`${document.metadata.title} fold diagram`} onClick={pickPaperPoint}>
    <defs><marker id="origami-arrowhead" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 z" fill={colors.reference} /></marker></defs>
    {ordered.map((object) => {
      const state = timeline[object.id];
      if (!state.visible) return null;
      const common = {
        className: className(object), tabIndex: 0, role: "button", "aria-label": objectName(object),
        "data-object-id": object.id, "data-motion": state.folding ? "folding" : movingIds.has(object.id) ? "moving" : "stationary",
        onClick: () => activate(object.id), onKeyDown: (event: KeyboardEvent<SVGGElement>) => keyboardActivate(event, object.id),
        onMouseEnter: () => setHoveredId(object.id), onMouseLeave: () => setHoveredId(undefined),
      };
      const data = object.data;
      return <g key={object.id} {...common}>
        {data.kind === "polygon" && <polygon points={(state.points ?? data.points).map(({ x, y }) => `${x},${y}`).join(" ")} fill={state.side === "back" ? "#8bb6c7" : colors.paper} fillOpacity={state.opacity} stroke="#587080" strokeWidth="0.06" />}
        {(data.kind === "crease" || data.kind === "segment" || data.kind === "arrow") && <line x1={data.start.x} y1={data.start.y} x2={data.end.x} y2={data.end.y} opacity={state.opacity} pathLength="1" strokeDashoffset={1 - state.drawProgress} stroke={colors[object.role] ?? colors.reference} strokeWidth={data.kind === "crease" ? "0.1" : "0.08"} strokeDasharray={data.kind === "crease" ? "0.04 0.03" : state.drawProgress < 1 ? "1" : undefined} markerEnd={data.kind === "arrow" ? "url(#origami-arrowhead)" : undefined} />}
        {data.kind === "point" && <circle cx={data.position.x} cy={data.position.y} r="0.13" opacity={state.opacity} fill={colors[object.role] ?? "#fff"} />}
        {data.kind === "label" && <text x={data.position.x} y={data.position.y} opacity={state.opacity} fill={colors[object.role] ?? "#fff"} fontSize="0.35" textAnchor="middle">{data.text}</text>}
        <title>{objectName(object)}</title>
      </g>;
    })}
  </svg>;
}
