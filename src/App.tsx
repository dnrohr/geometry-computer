import { useCallback, useMemo, useRef, useState } from "react";
import {
  compileExpression,
  type CompiledScene,
} from "./domain/compiler/compileExpression";
import { parseExpression } from "./domain/parser/parseExpression";
import { gallery, type GalleryExample } from "./domain/examples/gallery";
import { evaluateReveal } from "./domain/reveal/evaluateReveal";
import {
  constructionJson,
  downloadText,
  serializeSvg,
} from "./domain/export/exportConstruction";
import { SvgConstructionCanvas } from "./render/svg/SvgConstructionCanvas";
import { ExpressionInput } from "./ui/input/ExpressionInput";
import { ExampleGallery } from "./ui/examples/ExampleGallery";
import { ObjectInspector } from "./ui/inspector/ObjectInspector";
import { ProofCard } from "./ui/proofs/ProofCard";
import { ExpressionTree } from "./ui/expression/ExpressionTree";
import { OperationBadge } from "./ui/steps/OperationBadge";
import { activeStepAt, useScrollProgress } from "./ui/scroll/useScrollProgress";
import {
  highlightedObjectIds,
  highlightedStepIds,
  type InteractionState,
} from "./ui/interaction/interactionState";
import "./App.css";

const defaultValues = { a: 2, b: 1, x: 3, y: 2 };
const build = (
  source: string,
  values: Record<string, number>,
  original = "3a² + 4ab + b²",
  simplified = "(3a + b)(a + b)",
) => compileExpression(parseExpression(source), values, original, simplified);

function App() {
  const [expression, setExpression] = useState("(3*a + b) * (a + b)");
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
  const [proofHighlights, setProofHighlights] = useState<string[]>([]);
  const [scaffoldMode, setScaffoldMode] = useState<
    "all" | "current" | "hide-retired"
  >("current");
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
      </section>
    </main>
  );
}
export default App;
