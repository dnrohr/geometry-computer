import { useCallback, useMemo, useRef, useState } from "react";
import {
  compileExpression,
  type CompiledScene,
} from "./domain/compiler/compileExpression";
import { parseExpression } from "./domain/parser/parseExpression";
import { gallery, type GalleryExample } from "./domain/examples/gallery";
import { evaluateReveal } from "./domain/reveal/evaluateReveal";
import { compiledOrigamiArithmeticExamples } from "./domain/origami/examples";
import { evaluateOrigamiReveal } from "./domain/origami/reveal/evaluateOrigamiReveal";
import {
  constructionJson,
  downloadText,
  serializeSvg,
} from "./domain/export/exportConstruction";
import { SvgConstructionCanvas } from "./render/svg/SvgConstructionCanvas";
import { SvgOrigamiCanvas } from "./render/origami/svg/SvgOrigamiCanvas";
import { buildOrigamiVisualRoleMap } from "./render/origami/visualRoles";
import { ExpressionInput } from "./ui/input/ExpressionInput";
import { ExampleGallery } from "./ui/examples/ExampleGallery";
import { ObjectInspector } from "./ui/inspector/ObjectInspector";
import { ProofCard } from "./ui/proofs/ProofCard";
import { ExpressionTree } from "./ui/expression/ExpressionTree";
import { OperationBadge } from "./ui/steps/OperationBadge";
import { InstructionsCard } from "./ui/steps/InstructionsCard";
import { activeStepAt, useScrollProgress } from "./ui/scroll/useScrollProgress";
import {
  highlightedObjectIds,
  highlightedStepIds,
  type InteractionState,
} from "./ui/interaction/interactionState";
import "./App.css";

const defaultValues = { a: 3, b: 2, x: 3, y: 2 };
const origamiRoadmap = [
  {
    phase: "1",
    title: "Model folds as first-class operations",
    priority: "Near term",
    summary:
      "Define the flat-origami computation vocabulary beside the current construction model: points, creases, reflected objects, alignment constraints, and fold certificates.",
    work: [
      "Add isolated origami domain types for points, lines, creases, reflected objects, fold steps, and fold scenes.",
      "Implement deterministic Huzita-Hatori axiom templates with preconditions, selected solution IDs, and degeneracy notes.",
      "Add fixture-level tests for fold validation, solution ordering, and provenance metadata.",
      "Document the fold data model without importing compass-straightedge construction types.",
    ],
  },
  {
    phase: "2",
    title: "Build an origami-only arithmetic trace",
    priority: "Near term",
    summary:
      "Compile a small set of arithmetic examples into folds without touching the existing compass-and-straightedge compiler.",
    work: [
      "Create a separate origami example gallery with constants, copying, addition, subtraction, multiplication, division, and square root.",
      "Build an origami compiler entry point that accepts parsed expressions but emits origami-only fold traces.",
      "Add arithmetic macro tests that compare symbolic provenance and sampled numeric outputs.",
      "Keep cubic roots and angle trisection as documented research spikes until the basic arithmetic trace is stable.",
    ],
  },
  {
    phase: "3",
    title: "Render crease-pattern explanations",
    priority: "Mid term",
    summary:
      "Create an inspectable SVG crease-pattern viewer that explains each fold, reflected point, and chosen intersection.",
    work: [
      "Add an origami SVG renderer for paper boundary, creases, reflected geometry, labels, and extracted result segments.",
      "Add reveal controls, active-fold highlighting, object selection, and an origami object inspector.",
      "Add proof cards for each fold axiom and arithmetic macro using origami-specific fixtures.",
      "Verify desktop and mobile layouts without changing the compass-straightedge workspace contract.",
    ],
  },
  {
    phase: "4",
    title: "Prepare for a shared computation core",
    priority: "Merge path",
    summary:
      "Identify the common layer between ruler-compass constructions and folds before merging UI or compiler paths.",
    work: [
      "Compare operation traces, proof references, object provenance, and exports after both systems implement one arithmetic family.",
      "Introduce shared interfaces only where duplicated code has matching behavior and tests on both sides.",
      "Add compatibility tests before any compiler, renderer, or export merger.",
      "Merge tabs later around a construction-system selector once feature parity and regression coverage justify it.",
    ],
  },
];

const build = (
  source: string,
  values: Record<string, number>,
  original = source,
  simplified = source,
) => compileExpression(parseExpression(source), values, original, simplified);

function CompassStraightedgeWorkspace() {
  const [expression, setExpression] = useState("sqrt(3*a - b*b)");
  const [values, setValues] = useState<Record<string, number>>(defaultValues);
  const [scene, setScene] = useState<CompiledScene>(() =>
    build(expression, values),
  );
  const [error, setError] = useState<string>();
  const [interaction, setInteraction] = useState<InteractionState>({
    activeStepId: scene.steps[0]?.id,
  });
  const [progress, setProgress] = useState(1);
  const [proofId, setProofId] = useState<string>();
  const [instructionStepId, setInstructionStepId] = useState<string>();
  const [proofHighlights, setProofHighlights] = useState<string[]>([]);
  const [scaffoldMode, setScaffoldMode] = useState<
    "all" | "current" | "hide-retired"
  >("all");
  const svgRef = useRef<SVGSVGElement>(null);
  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null);
  const handleScrollProgress = useCallback(
    (next: number) => {
      setProgress(next);
      const step = scene.steps[activeStepAt(next, scene.steps.length)];
      if (step)
        setInteraction((state) => ({ ...state, activeStepId: step.id }));
    },
    [scene.steps],
  );
  useScrollProgress(scrollElement, handleScrollProgress);
  const selected = scene.objects.find(
    ({ id }) => id === interaction.selectedObjectId,
  );
  const activeStep = scene.steps.find(
    ({ id }) => id === interaction.activeStepId,
  );
  const objectHighlights = highlightedObjectIds(
    interaction,
    scene.steps,
    scene.objects,
  );
  proofHighlights.forEach((id) => objectHighlights.add(id));
  const stepHighlights = highlightedStepIds(interaction, scene.objects);
  const renderStates = useMemo(
    () => evaluateReveal(scene.revealActions, progress),
    [scene, progress],
  );
  const compile = (
    source = expression,
    nextValues = values,
    original?: string,
    simplified?: string,
  ) => {
    try {
      const next = build(
        source,
        nextValues,
        original ?? source,
        simplified ?? source,
      );
      setScene(next);
      setExpression(source);
      setValues(nextValues);
      setError(undefined);
      setInteraction({ activeStepId: next.steps[0]?.id });
      setInstructionStepId(undefined);
      setProgress(1);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to compile this expression.",
      );
    }
  };
  const selectExample = (example: GalleryExample) =>
    compile(
      example.expression,
      { ...defaultValues, ...example.values },
      example.simplified ?? example.expression,
      example.expression,
    );
  const selectStep = (id: string) => {
    setInteraction((state) => ({
      ...state,
      activeStepId: id,
      selectedStepId: id,
    }));
    const index = scene.steps.findIndex((step) => step.id === id);
    setProgress((index + 1) / scene.steps.length);
  };
  const moveStep = (delta: number) => {
    const index = Math.max(
      0,
      scene.steps.findIndex(({ id }) => id === interaction.activeStepId),
    );
    selectStep(
      scene.steps[Math.max(0, Math.min(scene.steps.length - 1, index + delta))]
        .id,
    );
  };
  return (
    <main
      className="app-shell"
      onKeyDown={(event) => {
        if (event.altKey && event.key === "ArrowDown") moveStep(1);
        if (event.altKey && event.key === "ArrowUp") moveStep(-1);
      }}
    >
      <header className="masthead">
        <div>
          <p className="eyebrow">Compass · Straightedge · Algebra</p>
          <h1>Geometry Computer</h1>
        </div>
        <p className="lede">
          Compile field expressions into inspectable, proof-linked
          compass-and-straightedge constructions.
        </p>
      </header>
      <ExpressionInput
        expression={expression}
        values={values}
        error={error}
        onExpression={setExpression}
        onValues={setValues}
        onCompile={() => compile()}
      />
      <ExampleGallery examples={gallery} onSelect={selectExample} />
      <section className="expression-summary" aria-labelledby="example-title">
        <p className="section-label">Current construction</p>
        <h2 id="example-title">{scene.title}</h2>
        <div className="expression-equivalence">
          <span>{scene.expression}</span>
          <span aria-hidden="true">=</span>
          <strong>{scene.simplifiedExpression}</strong>
          <span className="numeric-result">
            → {Number(scene.value.toFixed(5))}
          </span>
        </div>
      </section>
      <div className="toolbar" aria-label="Construction controls">
        <label>
          Reveal{" "}
          <input
            aria-label="Reveal progress"
            type="range"
            min="0"
            max="1"
            step=".01"
            value={progress}
            onChange={(event) => setProgress(Number(event.target.value))}
          />
        </label>
        <label>
          Scaffolding{" "}
          <select
            value={scaffoldMode}
            onChange={(event) =>
              setScaffoldMode(event.target.value as typeof scaffoldMode)
            }
          >
            <option value="all">Show all</option>
            <option value="current">Current step</option>
            <option value="hide-retired">Hide retired</option>
          </select>
        </label>
        <button
          type="button"
          onClick={() =>
            downloadText(
              "construction.json",
              constructionJson(scene),
              "application/json",
            )
          }
        >
          Export JSON
        </button>
        <button
          type="button"
          onClick={() =>
            svgRef.current &&
            downloadText(
              "construction.svg",
              serializeSvg(svgRef.current),
              "image/svg+xml",
            )
          }
        >
          Export current SVG
        </button>
        <button
          type="button"
          onClick={() =>
            svgRef.current &&
            downloadText(
              "construction-final.svg",
              serializeSvg(svgRef.current, true),
              "image/svg+xml",
            )
          }
        >
          Export clean SVG
        </button>
      </div>
      <section
        ref={setScrollElement}
        className="construction-layout"
        aria-label="Interactive geometric construction"
      >
        <div className="canvas-panel">
          <SvgConstructionCanvas
            svgRef={svgRef}
            objects={scene.objects}
            viewBox={scene.viewBox}
            title={scene.title}
            description={`Construct ${scene.simplifiedExpression} from the supplied lengths and a unit.`}
            expressionSummary={`${scene.expression} = ${scene.simplifiedExpression}`}
            renderStates={renderStates}
            highlightedIds={objectHighlights}
            scaffoldMode={scaffoldMode}
            activeStepId={interaction.activeStepId}
            onSelectObject={(id) =>
              setInteraction((state) => ({ ...state, selectedObjectId: id }))
            }
            onHoverObject={(id) =>
              setInteraction((state) => ({ ...state, hoveredObjectId: id }))
            }
          />
        </div>
        <aside className="steps-panel" aria-labelledby="steps-title">
          <p className="section-label">Generated trace</p>
          <h2 id="steps-title">Construction steps</h2>
          <p className="keyboard-hint">Alt + ↑/↓ moves between steps.</p>
          <ol>
            {scene.steps.map((step) => (
              <li
                key={step.id}
                id={step.id}
                data-output-ids={step.outputObjectIds.join(" ")}
                className={
                  interaction.activeStepId === step.id ||
                  stepHighlights.has(step.id)
                    ? "active"
                    : ""
                }
                onMouseEnter={() =>
                  setInteraction((state) => ({
                    ...state,
                    hoveredStepId: step.id,
                  }))
                }
                onMouseLeave={() =>
                  setInteraction((state) => ({
                    ...state,
                    hoveredStepId: undefined,
                  }))
                }
              >
                <button
                  className="step-button"
                  type="button"
                  onClick={() => selectStep(step.id)}
                >
                  <h3>{step.title}</h3>
                  <p>{step.summary}</p>
                </button>
                <OperationBadge
                  step={step}
                  onProof={() => setProofId(step.proofId)}
                />
                <button
                  className="how-button"
                  type="button"
                  onClick={() => setInstructionStepId(step.id)}
                  aria-label={`How to: ${step.title}`}
                >
                  How?
                </button>
              </li>
            ))}
          </ol>
        </aside>
      </section>
      <section className="details-grid">
        <ExpressionTree
          expression={scene.ast}
          originalExpression={scene.expression}
          simplifiedExpression={scene.simplifiedExpression}
          activeExpression={(activeStep?.parentStepId
            ? scene.steps.find(({ id }) => id === activeStep.parentStepId)
                ?.title
            : activeStep?.title
          )?.replace(/^Construct |^Place /, "")}
          onSelect={(represented) => {
            const objectIds = scene.objects
              .filter((item) => item.represents === represented)
              .map(({ id }) => id);
            if (objectIds.length)
              setInteraction((state) => ({
                ...state,
                selectedObjectId: objectIds[0],
                expressionObjectIds: objectIds,
              }));
          }}
        />
        <ObjectInspector
          object={selected}
          onClose={() =>
            setInteraction((state) => ({
              ...state,
              selectedObjectId: undefined,
            }))
          }
        />
        {proofId && (
          <ProofCard
            proof={scene.proofs.find(({ id }) => id === proofId)!}
            onHighlight={setProofHighlights}
            onClose={() => setProofId(undefined)}
          />
        )}
        {instructionStepId && (
          <InstructionsCard
            step={scene.steps.find(({ id }) => id === instructionStepId)!}
            onClose={() => setInstructionStepId(undefined)}
          />
        )}
      </section>
    </main>
  );
}

function OrigamiRoadmap() {
  const examples = useMemo(() => compiledOrigamiArithmeticExamples(), []);
  const [exampleIndex, setExampleIndex] = useState(0);
  const [progress, setProgress] = useState(1);
  const [activeStepId, setActiveStepId] = useState<string>();
  const [selectedObjectId, setSelectedObjectId] = useState<string>();
  const [proofId, setProofId] = useState<string>();
  const origamiSvgRef = useRef<SVGSVGElement>(null);
  const scene = examples[exampleIndex].scene;
  const activeStep = scene.steps.find(({ id }) => id === activeStepId);
  const selectedObject = scene.objects.find(
    ({ id }) => id === selectedObjectId,
  );
  const activeProof = scene.proofs.find(({ id }) => id === proofId);
  const highlightedIds = new Set<string>([
    ...(activeStep?.inputObjectIds ?? []),
    ...(activeStep?.outputObjectIds ?? []),
    ...(activeStep?.createdObjectIds ?? []),
  ]);
  if (selectedObjectId) highlightedIds.add(selectedObjectId);
  const renderStates = useMemo(
    () => evaluateOrigamiReveal(scene.revealActions, progress),
    [scene.revealActions, progress],
  );
  const visualRoles = useMemo(
    () => buildOrigamiVisualRoleMap(scene, activeStepId, renderStates),
    [scene, activeStepId, renderStates],
  );
  const selectOrigamiStep = (id: string) => {
    setActiveStepId(id);
    const index = scene.steps.findIndex((step) => step.id === id);
    setProgress((index + 1) / scene.steps.length);
  };
  const origamiStepProofStatus = (proofId?: string) => {
    if (!proofId) return "none";
    return scene.proofs.some(({ id }) => id === proofId) ? "linked" : "missing";
  };
  const moveOrigamiStep = (delta: number) => {
    const index = Math.max(
      0,
      scene.steps.findIndex(({ id }) => id === activeStepId),
    );
    selectOrigamiStep(
      scene.steps[Math.max(0, Math.min(scene.steps.length - 1, index + delta))]
        .id,
    );
  };

  return (
    <main
      className="app-shell"
      onKeyDown={(event) => {
        if (event.altKey && event.key === "ArrowDown") moveOrigamiStep(1);
        if (event.altKey && event.key === "ArrowUp") moveOrigamiStep(-1);
      }}
    >
      <header className="masthead">
        <div>
          <p className="eyebrow">Flat Origami · Computation · Roadmap</p>
          <h1>Origami Computer</h1>
        </div>
        <p className="lede">
          Explore fold-based computation in its own workspace while preserving
          the current compass-and-straightedge implementation unchanged.
        </p>
      </header>
      <section className="roadmap-priority" aria-labelledby="origami-priority">
        <p className="section-label">Top priority</p>
        <h2 id="origami-priority">
          Do not modify the existing construction flow
        </h2>
        <p>
          Treat flat origami as a parallel research track for now. New models,
          renderers, proof cards, and examples should live behind this tab until
          the fold system has enough stability to justify a deliberate merger.
        </p>
      </section>
      <section className="roadmap-layout" aria-labelledby="origami-roadmap">
        <div>
          <p className="section-label">Roadmap</p>
          <h2 id="origami-roadmap">Fold-first computation plan</h2>
          <div className="roadmap-list">
            {origamiRoadmap.map((item) => (
              <article key={item.phase} className="roadmap-card">
                <div className="roadmap-card-header">
                  <span aria-label={`Phase ${item.phase}`}>{item.phase}</span>
                  <small>{item.priority}</small>
                </div>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
                <ul>
                  {item.work.map((task) => (
                    <li key={task}>{task}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
        <aside className="roadmap-merge-notes" aria-labelledby="merge-notes">
          <p className="section-label">Merger watchlist</p>
          <h2 id="merge-notes">Design for eventual convergence</h2>
          <p>
            Keep names, operation IDs, provenance, proof references, and export
            metadata compatible where it is cheap. Avoid shared abstractions
            until both systems reveal the same pressure points.
          </p>
          <dl>
            <dt>Shared later</dt>
            <dd>
              Expression parsing, operation trace shape, proof cards, export
              metadata.
            </dd>
            <dt>Separate now</dt>
            <dd>
              Fold solver, crease-pattern rendering, axiom proofs, origami
              examples.
            </dd>
            <dt>Merge trigger</dt>
            <dd>
              At least one arithmetic family implemented and tested in both
              systems.
            </dd>
          </dl>
        </aside>
      </section>
      <section className="origami-workspace" aria-labelledby="origami-trace">
        <div className="origami-workspace-header">
          <div>
            <p className="section-label">Interactive trace</p>
            <h2 id="origami-trace">{examples[exampleIndex].title}</h2>
          </div>
          <label>
            Reveal{" "}
            <input
              aria-label="Origami reveal progress"
              type="range"
              min="0"
              max="1"
              step=".01"
              value={progress}
              onChange={(event) => setProgress(Number(event.target.value))}
            />
          </label>
          <button
            type="button"
            onClick={() =>
              downloadText(
                "origami-trace.json",
                JSON.stringify(scene, null, 2),
                "application/json",
              )
            }
          >
            Export origami JSON
          </button>
          <button
            type="button"
            onClick={() =>
              origamiSvgRef.current &&
              downloadText(
                "origami-trace.svg",
                serializeSvg(origamiSvgRef.current),
                "image/svg+xml",
              )
            }
          >
            Export origami SVG
          </button>
        </div>
        <div className="origami-example-tabs" aria-label="Origami examples">
          {examples.map((example, index) => (
            <button
              key={example.title}
              type="button"
              aria-pressed={index === exampleIndex}
              onClick={() => {
                setExampleIndex(index);
                setProgress(1);
                setActiveStepId(undefined);
                setSelectedObjectId(undefined);
                setProofId(undefined);
              }}
            >
              {example.title}
            </button>
          ))}
        </div>
        <div className="origami-trace-layout">
          <div className="origami-canvas-panel">
            <SvgOrigamiCanvas
              svgRef={origamiSvgRef}
              objects={scene.objects}
              title={`${scene.title}: ${scene.expression}`}
              description={scene.description}
              renderStates={renderStates}
              visualRoles={visualRoles}
              highlightedIds={highlightedIds}
              onSelectObject={setSelectedObjectId}
            />
          </div>
          <aside className="origami-steps-panel" aria-labelledby="folds-title">
            <p className="section-label">Generated folds</p>
            <h2 id="folds-title">Origami steps</h2>
            <ol>
              {scene.steps.map((step) => (
                <li
                  key={step.id}
                  className={step.id === activeStepId ? "active" : ""}
                >
                  <button
                    className="step-button"
                    type="button"
                    onClick={() => selectOrigamiStep(step.id)}
                  >
                    <h3>{step.title}</h3>
                    <p>{step.summary}</p>
                  </button>
                  <dl className="origami-step-metadata">
                    <div>
                      <dt>Macro</dt>
                      <dd>{step.operation ?? "none"}</dd>
                    </div>
                    <div>
                      <dt>Axiom</dt>
                      <dd>{step.axiom ?? "macro trace"}</dd>
                    </div>
                    <div>
                      <dt>Branch</dt>
                      <dd>
                        {step.macroTrace?.branchSelections.find(
                          ({ selected }) => selected,
                        )?.label ??
                          step.selectedSolutionId ??
                          "deterministic"}
                      </dd>
                    </div>
                    <div>
                      <dt>Proof</dt>
                      <dd>{origamiStepProofStatus(step.proofId)}</dd>
                    </div>
                    <div>
                      <dt>Degeneracy</dt>
                      <dd>
                        {(step.degeneracies?.length ?? 0) +
                          (step.macroTrace?.degeneracyObjectIds.length ?? 0) ||
                          "none"}
                      </dd>
                    </div>
                  </dl>
                  {step.proofId && (
                    <button
                      className="how-button"
                      type="button"
                      onClick={() => setProofId(step.proofId)}
                    >
                      Why?
                    </button>
                  )}
                </li>
              ))}
            </ol>
          </aside>
          <aside className="origami-inspector" aria-labelledby="origami-object">
            <p className="section-label">Object inspector</p>
            <h2 id="origami-object">Origami object</h2>
            {selectedObject ? (
              <dl>
                <dt>ID</dt>
                <dd>{selectedObject.id}</dd>
                <dt>Kind</dt>
                <dd>{selectedObject.kind}</dd>
                <dt>Role</dt>
                <dd>{selectedObject.role}</dd>
                <dt>Expression</dt>
                <dd>{selectedObject.provenance.expression ?? "none"}</dd>
              </dl>
            ) : (
              <p>Select a crease, point, segment, or label in the diagram.</p>
            )}
          </aside>
          {activeProof && (
            <article
              className="origami-proof-card"
              aria-labelledby="origami-proof-title"
            >
              <header>
                <div>
                  <p className="section-label">Proof</p>
                  <h2 id="origami-proof-title">{activeProof.title}</h2>
                </div>
                <button type="button" onClick={() => setProofId(undefined)}>
                  Close
                </button>
              </header>
              <p>{activeProof.intuition}</p>
              <ul>
                {activeProof.claims.map((claim) => (
                  <li key={claim.id}>{claim.text}</li>
                ))}
              </ul>
              <p>{activeProof.conclusion}</p>
            </article>
          )}
        </div>
      </section>
    </main>
  );
}

function App() {
  const [activeWorkspace, setActiveWorkspace] = useState<"compass" | "origami">(
    "compass",
  );
  return (
    <>
      <nav className="workspace-tabs" aria-label="Computation workspace">
        <button
          type="button"
          aria-pressed={activeWorkspace === "compass"}
          onClick={() => setActiveWorkspace("compass")}
        >
          Compass + straightedge
        </button>
        <button
          type="button"
          aria-pressed={activeWorkspace === "origami"}
          onClick={() => setActiveWorkspace("origami")}
        >
          Flat origami roadmap
        </button>
      </nav>
      <div hidden={activeWorkspace !== "compass"}>
        <CompassStraightedgeWorkspace />
      </div>
      <div hidden={activeWorkspace !== "origami"}>
        <OrigamiRoadmap />
      </div>
    </>
  );
}
export default App;
