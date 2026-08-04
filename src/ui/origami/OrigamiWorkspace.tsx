import { useMemo, useRef, useState } from "react";
import { downloadText } from "../../domain/export/exportConstruction";
import { compileOrigamiExample, origamiExamples } from "../../domain/origami/examples";
import { compileGuidedFold, type GuidedFoldRequest } from "../../domain/origami/guidedFold";
import { appendSessionFold, emptyOrigamiSession, parseOrigamiSession, serializeOrigamiSession, sessionPosition, threeFoldReferenceSession } from "../../domain/origami/session";
import { activeTracePhase, buildOrigamiTrace, type OrigamiTracePhase } from "../../domain/origami/trace";
import { ManimExportPanel } from "../../render/manim/ManimExportPanel";
import { OrigamiAuthorPanel, type OrigamiAuthorHandle } from "./OrigamiAuthorPanel";
import { OrigamiCanvas } from "./OrigamiCanvas";
import { OrigamiObjectInspector } from "./OrigamiObjectInspector";
import { OrigamiPlaybackControls } from "./OrigamiPlaybackControls";
import { OrigamiSessionPanel } from "./OrigamiSessionPanel";
import { OrigamiTracePanel } from "./OrigamiTracePanel";
import { useOrigamiPlayback } from "./useOrigamiPlayback";
import { useSessionPlayback } from "./useSessionPlayback";
import { Origami3DCanvas } from "./Origami3DCanvas";
import { OrigamiComputePanel } from "./OrigamiComputePanel";
import type { OrigamiComputePlan } from "../../domain/origami/compute/planExpression";

type HistoryEntry = ReturnType<typeof compileGuidedFold> & { request: GuidedFoldRequest };

export function OrigamiWorkspace() {
  const [selectedId, setSelectedId] = useState(origamiExamples[0].id);
  const [selectedObjectId, setSelectedObjectId] = useState<string>();
  const [hoveredPhase, setHoveredPhase] = useState<OrigamiTracePhase>();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [authorError, setAuthorError] = useState<string>();
  const [session, setSession] = useState(emptyOrigamiSession());
  const [showSession, setShowSession] = useState(false);
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");
  const authorRef = useRef<OrigamiAuthorHandle>(null);
  const builtInExample = origamiExamples.find(({ id }) => id === selectedId)!;
  const builtInDocument = useMemo(() => compileOrigamiExample(builtInExample), [builtInExample]);
  const guided = history[historyIndex];
  const localExample = guided?.example ?? builtInExample;
  const localDocument = guided?.document ?? builtInDocument;
  const localPlayback = useOrigamiPlayback(localDocument);
  const sessionPlayback = useSessionPlayback(session);
  const position = sessionPosition(session, sessionPlayback.time);
  const sessionActive = showSession && Boolean(position);
  const example = sessionActive ? position!.step.example : localExample;
  const document = sessionActive ? position!.step.document : localDocument;
  const displayTime = sessionActive ? position!.localTime : localPlayback.time;
  const selectedObject = document.objects.find(({ id }) => id === selectedObjectId);
  const phases = useMemo(() => buildOrigamiTrace(example, document), [example, document]);
  const activePhase = activeTracePhase(phases, displayTime);
  const highlightedIds = useMemo(() => new Set((hoveredPhase ?? activePhase).objectIds), [hoveredPhase, activePhase]);

  const chooseExample = (id: string) => { localPlayback.restart(); setShowSession(false); setSelectedObjectId(undefined); setAuthorError(undefined); setHistory([]); setHistoryIndex(-1); setSelectedId(id); };
  const compileRequest = (request: GuidedFoldRequest) => {
    try { const next = { request, ...compileGuidedFold(request) }; const retained = history.slice(0, historyIndex + 1); setHistory([...retained, next]); setHistoryIndex(retained.length); setShowSession(false); setSelectedObjectId(undefined); setAuthorError(undefined); localPlayback.restart(); }
    catch (reason) { setAuthorError(reason instanceof Error ? reason.message : "The requested fold could not be computed."); }
  };
  const appendCurrent = () => {
    if (!guided) return;
    try { const next = appendSessionFold(session, guided.request); sessionPlayback.setTime(session.duration); setSession(next); setShowSession(true); setAuthorError(undefined); }
    catch (reason) { setAuthorError(`This fold cannot be added to the current paper state: ${reason instanceof Error ? reason.message : String(reason)}`); }
  };
  const loadSession = (source: string) => { try { const next = parseOrigamiSession(source); setSession(next); sessionPlayback.restart(); setShowSession(true); setAuthorError(undefined); } catch (reason) { setAuthorError(reason instanceof Error ? reason.message : "The session could not be loaded."); } };
  const loadReference = () => { try { setSession(threeFoldReferenceSession()); sessionPlayback.restart(); setShowSession(true); setAuthorError(undefined); } catch (reason) { setAuthorError(reason instanceof Error ? reason.message : "The reference could not be loaded."); } };
  const undo = () => { if (historyIndex >= 0) { localPlayback.restart(); setShowSession(false); setHistoryIndex(historyIndex - 1); } };
  const redo = () => { if (historyIndex < history.length - 1) { localPlayback.restart(); setShowSession(false); setHistoryIndex(historyIndex + 1); } };
  const reset = () => { localPlayback.restart(); setShowSession(false); setHistory([]); setHistoryIndex(-1); setAuthorError(undefined); };
  const loadComputePlan = (plan: OrigamiComputePlan) => {
    setSession(plan.session);
    sessionPlayback.restart();
    setShowSession(true);
    setSelectedObjectId(undefined);
    setAuthorError(undefined);
  };
  const selectComputeNode = (plan: OrigamiComputePlan, nodeId: string) => {
    const node = plan.nodes.find(({ expressionNodeId }) => expressionNodeId === nodeId);
    const foldId = node?.foldIds[0];
    const step = plan.session.steps.find(({ id }) => id === foldId);
    if (step) sessionPlayback.setTime(step.start);
  };

  return <>
    <OrigamiComputePanel onCompile={loadComputePlan} onSelectNode={selectComputeNode} />
    <section className="origami-intro"><p className="section-label">Computed paper folding</p><h2>Choose a fold</h2><div className="origami-examples" role="list" aria-label="Origami examples">{origamiExamples.map((item) => <button key={item.id} type="button" className={item.id === selectedId && !guided ? "active" : ""} onClick={() => chooseExample(item.id)}><strong>{item.title}</strong><span>{item.description}</span></button>)}</div></section>
    <OrigamiAuthorPanel ref={authorRef} onCompile={compileRequest} onUndo={undo} onRedo={redo} onReset={reset} canUndo={historyIndex >= 0} canRedo={historyIndex < history.length - 1} error={authorError} />
    <OrigamiSessionPanel session={session} playback={sessionPlayback} activeStepId={sessionActive ? position?.step.id : undefined} canAppend={Boolean(guided)} onAppend={appendCurrent} onLoadReference={loadReference} onExport={() => downloadText("origami-session.json", serializeOrigamiSession(session), "application/json")} onImport={loadSession} onReset={() => { sessionPlayback.restart(); setSession(emptyOrigamiSession()); setShowSession(false); }} />
    <section className="origami-preview" aria-labelledby="origami-title"><div><p className="section-label">{sessionActive ? `Session fold ${position!.stepIndex + 1} of ${session.steps.length}` : "Current fold"}</p><h2 id="origami-title">{example.title}</h2><p>{example.description}</p><p className="origami-instruction">Move the <strong>{example.movingSide}</strong> side across the computed crease.</p><dl className="origami-provenance"><dt>Operation</dt><dd>{example.operation.replaceAll("-", " ")}</dd><dt>Branch</dt><dd>{example.branch ?? "unique"}</dd><dt>Assumptions</dt><dd>{example.assumptions.join(" ")}</dd><dt>Tolerance</dt><dd>1 × 10<sup>−9</sup></dd></dl><button type="button" onClick={() => downloadText(`${example.id}.json`, JSON.stringify(document, null, 2), "application/json")}>Export origami JSON</button></div>
      <div className="origami-canvas-stack"><div className="origami-view-switch" role="group" aria-label="Fold view"><button type="button" aria-pressed={viewMode === "2d"} className={viewMode === "2d" ? "active" : ""} onClick={() => setViewMode("2d")}>Precise 2D</button><button type="button" aria-pressed={viewMode === "3d"} className={viewMode === "3d" ? "active" : ""} onClick={() => setViewMode("3d")}>Interactive 3D</button></div>{viewMode === "2d" ? <OrigamiCanvas document={document} time={displayTime} selectedId={selectedObjectId} highlightedIds={highlightedIds} onSelect={setSelectedObjectId} onPaperPoint={(point) => authorRef.current?.applyCanvasPoint(point)} /> : <Origami3DCanvas document={document} time={displayTime} selectedId={selectedObjectId} />}{!sessionActive && <OrigamiPlaybackControls playback={localPlayback} />}</div>
    </section>
    <div className="origami-details"><OrigamiTracePanel phases={phases} activeId={activePhase.id} onSelect={(phase) => sessionActive ? sessionPlayback.setTime(position!.step.start + phase.time) : localPlayback.setTime(phase.time)} onHover={setHoveredPhase} /><OrigamiObjectInspector object={selectedObject} onClose={() => setSelectedObjectId(undefined)} /></div>
    <ManimExportPanel document={document} session={sessionActive ? session : undefined} />
  </>;
}
