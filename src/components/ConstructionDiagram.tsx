import {
  createConstructionDrawing,
  type DrawingPrimitive,
} from "../domain/construction";
import type { ConstructionStep } from "../domain/expression";

function Primitive({ primitive }: { primitive: DrawingPrimitive }) {
  if (primitive.type === "line") {
    return (
      <line
        x1={primitive.from.x}
        y1={primitive.from.y}
        x2={primitive.to.x}
        y2={primitive.to.y}
        className={primitive.role}
      />
    );
  }
  if (primitive.type === "circle") {
    return (
      <circle
        cx={primitive.center.x}
        cy={primitive.center.y}
        r={primitive.radius}
        className={primitive.role}
      />
    );
  }
  if (primitive.type === "arc") {
    return (
      <path
        d={`M ${primitive.start.x} ${primitive.start.y} A ${primitive.radius} ${primitive.radius} 0 0 1 ${primitive.end.x} ${primitive.end.y}`}
        className="guide"
      />
    );
  }
  if (primitive.type === "point") {
    return (
      <g>
        <circle
          cx={primitive.at.x}
          cy={primitive.at.y}
          r="5"
          className="vertex"
        />
        <text x={primitive.at.x} y={primitive.at.y - 13}>
          {primitive.label}
        </text>
      </g>
    );
  }
  return (
    <text x={primitive.at.x} y={primitive.at.y} className={primitive.role}>
      {primitive.text}
    </text>
  );
}

export function ConstructionDiagram({ step }: { step: ConstructionStep }) {
  const drawing = createConstructionDrawing(step);
  return (
    <section className="diagram" aria-labelledby="diagram-title">
      <div className="diagram-heading">
        <div>
          <p className="section-label">{step.id} · Geometric method</p>
          <h2 id="diagram-title">{drawing.title}</h2>
        </div>
        <output>{Number(step.value.toPrecision(10))}</output>
      </div>
      <svg
        viewBox="0 0 640 360"
        role="img"
        aria-label={`${step.id}: ${drawing.title}. ${drawing.method}`}
      >
        {drawing.primitives.map((primitive, index) => (
          <Primitive key={index} primitive={primitive} />
        ))}
      </svg>
      <p className="method">{drawing.method}</p>
    </section>
  );
}
