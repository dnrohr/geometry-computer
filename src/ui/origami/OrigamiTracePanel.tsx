import type { OrigamiTracePhase } from "../../domain/origami/trace";

export function OrigamiTracePanel({ phases, activeId, onSelect, onHover }: {
  phases: OrigamiTracePhase[]; activeId: string;
  onSelect: (phase: OrigamiTracePhase) => void; onHover: (phase?: OrigamiTracePhase) => void;
}) {
  return <section className="origami-trace" aria-labelledby="origami-trace-title">
    <p className="section-label">Fold trace</p><h2 id="origami-trace-title">Physical steps</h2>
    <ol>{phases.map((phase, index) => <li key={phase.id} className={phase.id === activeId ? "active" : ""} onMouseEnter={() => onHover(phase)} onMouseLeave={() => onHover()}>
      <button type="button" onClick={() => onSelect(phase)} aria-current={phase.id === activeId ? "step" : undefined}>
        <span>{index + 1}</span><div><strong>{phase.title}</strong><p>{phase.summary}</p><small>{phase.instruction}</small></div><time>{phase.time.toFixed(1)}s</time>
      </button>
    </li>)}</ol>
  </section>;
}
