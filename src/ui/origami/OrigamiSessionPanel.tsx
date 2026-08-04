import { useState } from "react";
import type { OrigamiSession } from "../../domain/origami/session";
import type { useSessionPlayback } from "./useSessionPlayback";
import { linePolygonSegment } from "../../domain/origami/geometry";

export function OrigamiSessionPanel({ session, playback, activeStepId, canAppend, onAppend, onLoadReference, onExport, onImport, onReset }: {
  session: OrigamiSession; playback: ReturnType<typeof useSessionPlayback>; activeStepId?: string; canAppend: boolean;
  onAppend: () => void; onLoadReference: () => void; onExport: () => void; onImport: (source: string) => void; onReset: () => void;
}) {
  const [source, setSource] = useState("");
  const paper = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 6 }, { x: 0, y: 6 }];
  const creases = (session.steps.at(-1)?.paperAfter.creases ?? []).map(({ id, line }) => ({ id, points: linePolygonSegment(line, paper) }));
  return <section className="origami-session" aria-labelledby="origami-session-title">
    <div><p className="section-label">Multi-fold session</p><h2 id="origami-session-title">Fold sequence</h2><p>Each new fold starts from the preceding flat paper state.</p></div>
    <div className="origami-session-actions"><button type="button" onClick={onAppend} disabled={!canAppend}>Add current fold</button><button type="button" onClick={onLoadReference}>Load three-fold reference</button><button type="button" onClick={onExport} disabled={!session.steps.length}>Save session JSON</button><button type="button" onClick={onReset} disabled={!session.steps.length}>Clear session</button></div>
    {session.steps.length > 0 && <><ol>{session.steps.map((step, index) => <li key={step.id} className={step.id === activeStepId ? "active" : ""}><button type="button" onClick={() => playback.setTime(step.start)}><span>{index + 1}</span>{step.example.title}<time>{step.start.toFixed(1)}s</time></button></li>)}</ol>
      <div className="origami-session-playback"><button type="button" onClick={playback.restart}>Restart</button><button type="button" onClick={playback.previous}>Previous fold</button>{playback.playing ? <button type="button" onClick={playback.pause}>Pause session</button> : <button type="button" onClick={playback.play}>Play session</button>}<button type="button" onClick={playback.next}>Next fold</button><label>Session timeline<input aria-label="Session timeline" type="range" min="0" max={session.duration} step="0.01" value={playback.time} onChange={(event) => playback.setTime(Number(event.target.value))} /></label><span>{playback.time.toFixed(1)}s / {session.duration.toFixed(1)}s</span></div>
      <div className="origami-crease-pattern"><div><strong>Accumulated crease pattern</strong><small>Open-sheet reference independent of the folded preview.</small></div><svg viewBox="0 0 10 6" role="img" aria-label="Accumulated crease pattern"><rect x="0" y="0" width="10" height="6" />{creases.map(({ id, points }) => <line data-testid="session-crease" key={id} x1={points[0].x} y1={points[0].y} x2={points[1].x} y2={points[1].y} />)}</svg></div></>}
    <details><summary>Load saved session</summary><textarea aria-label="Saved session JSON" value={source} onChange={(event) => setSource(event.target.value)} placeholder="Paste an origami session JSON document" /><button type="button" onClick={() => onImport(source)} disabled={!source.trim()}>Load session JSON</button></details>
  </section>;
}
