import type { ReactElement } from "react";
import type { GeomObject, Point2 } from "../../domain/geometry/types";
import { roleClassName } from "./objectStyles";

const polar = (center: Point2, radius: number, angle: number): Point2 => {
  const radians = (angle * Math.PI) / 180;
  return {
    x: center.x + radius * Math.cos(radians),
    y: center.y + radius * Math.sin(radians),
  };
};

export type RenderOptions = {
  drawProgress?: number;
  visible?: boolean;
  opacity?: number;
  dimmed?: boolean;
  highlighted?: boolean;
  interactive?: boolean;
  onSelect?: (id: string) => void;
  onHover?: (id?: string) => void;
};
export function renderObject(
  object: GeomObject,
  options: RenderOptions = {},
): ReactElement | null {
  const drawProgress = options.drawProgress ?? 1;
  const common = {
    id: `geom-${object.id}`,
    className: roleClassName(object.role),
    "data-object-id": object.id,
    "data-created-by": object.createdByStepId,
    "data-draw-progress": drawProgress,
    style: {
      opacity:
        options.visible === false ? 0 : options.dimmed ? 0.25 : options.opacity,
      strokeDasharray: drawProgress < 1 ? "100 100" : undefined,
      strokeDashoffset: drawProgress < 1 ? 100 - drawProgress * 100 : undefined,
    },
    tabIndex: options.interactive ? 0 : undefined,
    role: options.interactive ? "button" : undefined,
    "aria-label": options.interactive
      ? `${object.kind} ${object.label ?? object.represents ?? object.id}`
      : undefined,
    onClick: () => options.onSelect?.(object.id),
    onKeyDown: (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ")
        options.onSelect?.(object.id);
    },
    onMouseEnter: () => options.onHover?.(object.id),
    onMouseLeave: () => options.onHover?.(),
  };
  const data = object.data;

  switch (data.kind) {
    case "point":
      return (
        <g {...common}>
          <circle cx={data.position.x} cy={data.position.y} r="5" />
          {object.label && (
            <text x={data.position.x} y={data.position.y - 13}>
              {object.label}
            </text>
          )}
        </g>
      );
    case "segment":
    case "line":
    case "ray":
      return (
        <line
          {...common}
          x1={data.start.x}
          y1={data.start.y}
          x2={data.end.x}
          y2={data.end.y}
        />
      );
    case "circle":
      return (
        <circle
          {...common}
          cx={data.center.x}
          cy={data.center.y}
          r={data.radius}
        />
      );
    case "arc": {
      const start = polar(data.center, data.radius, data.startAngle);
      const end = polar(data.center, data.radius, data.endAngle);
      const largeArc = Math.abs(data.endAngle - data.startAngle) > 180 ? 1 : 0;
      return (
        <path
          {...common}
          d={`M ${start.x} ${start.y} A ${data.radius} ${data.radius} 0 ${largeArc} 1 ${end.x} ${end.y}`}
        />
      );
    }
    case "label":
      return (
        <text {...common} x={data.position.x} y={data.position.y}>
          {data.text}
        </text>
      );
    case "triangle":
      return (
        <polygon
          {...common}
          points={data.points.map(({ x, y }) => `${x},${y}`).join(" ")}
        />
      );
    default:
      return null;
  }
}
