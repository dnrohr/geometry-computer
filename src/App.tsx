import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  DEFAULT_ORIGAMI_FUNCTION_VALUES,
  advanceOrigamiFunctionPreview,
  clampOrigamiVariableValue,
  compileOrigamiFunctionPreview,
  evaluateOrigamiFunctionInput,
  origamiFunctionAnimationJson,
  origamiFunctionExamples,
  origamiVariableControls,
  setOrigamiFunctionPreviewPlaying,
  setOrigamiFunctionPreviewPaperStyle,
  setOrigamiFunctionPreviewPhase,
  setOrigamiFunctionPreviewProgress,
  setOrigamiFunctionPreviewReducedMotion,
  setOrigamiFunctionPreviewSpeed,
  stepOrigamiFunctionPreviewPhase,
  type OrigamiFunctionExample,
  type OrigamiPaperPattern,
} from "./domain/origami/function";
import {
  constructionJson,
  downloadText,
  serializeSvg,
} from "./domain/export/exportConstruction";
import { SvgConstructionCanvas } from "./render/svg/SvgConstructionCanvas";
import { SvgOrigamiCanvas } from "./render/origami/svg/SvgOrigamiCanvas";
import { SvgOrigamiFunctionAnimation } from "./render/origami/function/SvgOrigamiFunctionAnimation";
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
  const [functionSource, setFunctionSource] = useState("sqrt(a+1)");
  const [functionValues, setFunctionValues] = useState(
    DEFAULT_ORIGAMI_FUNCTION_VALUES,
  );
  const [functionPreview, setFunctionPreview] = useState(() =>
    compileOrigamiFunctionPreview("sqrt(a+1)", DEFAULT_ORIGAMI_FUNCTION_VALUES),
  );
  const [copiedFunctionReadout, setCopiedFunctionReadout] = useState("");
  const [progress, setProgress] = useState(1);
  const [activeStepId, setActiveStepId] = useState<string>();
  const [selectedObjectId, setSelectedObjectId] = useState<string>();
  const [proofId, setProofId] = useState<string>();
  const [selectedProofClaimId, setSelectedProofClaimId] = useState<string>();
  const [hoveredProofClaimId, setHoveredProofClaimId] = useState<string>();
  const origamiSvgRef = useRef<SVGSVGElement>(null);
  const functionAnimationSvgRef = useRef<SVGSVGElement>(null);
  const finalFunctionAnimationSvgRef = useRef<SVGSVGElement>(null);
  const scene = examples[exampleIndex].scene;
  useEffect(() => {
    if (
      functionPreview.status !== "compiled" ||
      !functionPreview.animation.playing ||
      functionPreview.animation.reducedMotion
    ) {
      return undefined;
    }
    const interval = window.setInterval(() => {
      setFunctionPreview((preview) =>
        advanceOrigamiFunctionPreview(
          preview,
          preview.status === "compiled" ? 0.04 * preview.animation.speed : 0.04,
        ),
      );
    }, 180);
    return () => window.clearInterval(interval);
  }, [functionPreview]);
  const activeStep = scene.steps.find(({ id }) => id === activeStepId);
  const selectedObject = scene.objects.find(
    ({ id }) => id === selectedObjectId,
  );
  const selectedObjectStep = scene.steps.find(
    ({ id }) => id === selectedObject?.createdByStepId,
  );
  const selectedObjectProof = scene.proofs.find(
    ({ id }) => id === selectedObjectStep?.proofId,
  );
  const activeProof = scene.proofs.find(({ id }) => id === proofId);
  const activeClaimId = hoveredProofClaimId ?? selectedProofClaimId;
  const activeProofClaim = scene.proofs
    .flatMap((proof) => proof.claims)
    .find(({ id }) => id === activeClaimId);
  const highlightedIds = new Set<string>([
    ...(activeStep?.inputObjectIds ?? []),
    ...(activeStep?.outputObjectIds ?? []),
    ...(activeStep?.createdObjectIds ?? []),
    ...(activeProofClaim?.highlightObjectIds ?? []),
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
  const selectOrigamiObject = (id: string) => {
    setSelectedObjectId(id);
    const matchingProof = scene.proofs.find((proof) =>
      proof.claims.some((claim) => claim.highlightObjectIds.includes(id)),
    );
    const matchingClaim = matchingProof?.claims.find((claim) =>
      claim.highlightObjectIds.includes(id),
    );
    const matchingStep = scene.steps.find(
      (step) => step.proofId === matchingProof?.id,
    );
    if (matchingProof) setProofId(matchingProof.id);
    if (matchingClaim) setSelectedProofClaimId(matchingClaim.id);
    if (matchingStep) setActiveStepId(matchingStep.id);
  };
  const origamiStepProofStatus = (proofId?: string) => {
    if (!proofId) return "none";
    return scene.proofs.some(({ id }) => id === proofId) ? "linked" : "missing";
  };
  const selectedBranch = selectedObjectStep?.macroTrace?.branchSelections.find(
    ({ selected }) => selected,
  );
  const rejectedBranches =
    selectedObjectStep?.macroTrace?.branchSelections.filter(
      ({ selected }) => !selected,
    ) ?? [];
  const sampledOrigamiValue = () => {
    if (!selectedObject) return "none";
    if (selectedObject.role === "result") return scene.value.toString();
    if (selectedObject.data.kind === "segment") {
      const { start, end } = selectedObject.data;
      return (Math.hypot(end.x - start.x, end.y - start.y) / 1.6).toFixed(3);
    }
    return "n/a";
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
  const functionReport = useMemo(
    () => evaluateOrigamiFunctionInput(functionSource, functionValues),
    [functionSource, functionValues],
  );
  const functionIssue =
    functionReport.status === "blocked"
      ? functionReport.validation.issues[0]?.message
      : functionReport.status === "parse-error"
        ? functionReport.failure.error
        : undefined;
  const functionIssueDetail =
    functionReport.status === "blocked"
      ? functionReport.validation.issues
          .map((issue) => {
            const label =
              issue.code === "DIVISION_BY_ZERO"
                ? "Denominator"
                : issue.code === "NEGATIVE_SQUARE_ROOT"
                  ? "Radicand"
                  : "Issue";
            return `${label} ${issue.expression}: ${issue.message}`;
          })
          .join(" ")
      : functionReport.status === "parse-error"
        ? functionReport.failure.error
        : "ready";
  const functionVariables = useMemo(
    () =>
      functionReport.status === "parse-error"
        ? []
        : functionReport.validation.source.variables,
    [functionReport],
  );
  const variableControls = useMemo(
    () => origamiVariableControls(functionVariables, functionValues),
    [functionVariables, functionValues],
  );
  const functionValue =
    functionReport.status === "valid"
      ? functionReport.validation.value?.toFixed(3)
      : functionIssue;
  const functionDisplayName =
    functionReport.status === "parse-error"
      ? "none"
      : functionReport.validation.source.source;
  const activeFunctionSampleValues =
    functionVariables
      .map((name) => `${name}=${functionValues[name]}`)
      .join(", ") || "no variables";
  const sampledFunctionReadout =
    functionReport.status === "valid"
      ? `${functionDisplayName} with ${activeFunctionSampleValues} => ${functionValue}`
      : "";
  const canCompileOrigamiFunction = functionReport.status === "valid";
  const copyOrigamiReadout = async (label: string, text: string) => {
    if (!text || !navigator.clipboard) {
      setCopiedFunctionReadout("Copy unavailable");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopiedFunctionReadout(`Copied ${label}`);
    } catch {
      setCopiedFunctionReadout("Copy unavailable");
    }
  };
  const compileOrigamiFunction = () => {
    if (!canCompileOrigamiFunction) return;
    setFunctionPreview(
      compileOrigamiFunctionPreview(functionSource, functionValues),
    );
  };
  const selectOrigamiFunctionExample = (example: OrigamiFunctionExample) => {
    setFunctionSource(example.displaySource);
    setFunctionValues({
      ...DEFAULT_ORIGAMI_FUNCTION_VALUES,
      ...example.values,
    });
    setFunctionPreview(
      compileOrigamiFunctionPreview(example.displaySource, {
        ...DEFAULT_ORIGAMI_FUNCTION_VALUES,
        ...example.values,
      }),
    );
  };
  const updateOrigamiVariable = (name: string, value: number) => {
    const nextValues = {
      ...functionValues,
      [name]: clampOrigamiVariableValue(value),
    };
    const nextPreview = compileOrigamiFunctionPreview(
      functionSource,
      nextValues,
    );
    setFunctionValues(nextValues);
    if (nextPreview.status === "compiled") {
      setFunctionPreview(nextPreview);
    }
  };
  const previewOrigamiFunctionAnimation = () =>
    setFunctionPreview((preview) => advanceOrigamiFunctionPreview(preview));
  const timelineDisabled = functionPreview.status !== "compiled";
  const paperStyle =
    functionPreview.status === "compiled"
      ? functionPreview.paperStyle
      : undefined;
  const solverReadiness =
    functionPreview.status === "compiled"
      ? functionPreview.plan.solverReadiness
      : undefined;
  const nextSolverWorkItem = solverReadiness?.workItems[0];
  const activeSolverWorkItem =
    functionPreview.status === "compiled"
      ? solverReadiness?.workItems.find(
          ({ phaseId }) => phaseId === functionPreview.animation.phaseId,
        )
      : undefined;
  const activeFoldCertificate =
    functionPreview.status === "compiled"
      ? functionPreview.plan.phases.find(
          ({ id }) => id === functionPreview.animation.phaseId,
        )?.foldCertificate
      : undefined;
  const finalFunctionPreview = useMemo(() => {
    if (functionPreview.status !== "compiled") return functionPreview;
    const finalPhase = functionPreview.plan.phases.at(-1);
    return finalPhase
      ? setOrigamiFunctionPreviewPhase(functionPreview, finalPhase.id)
      : functionPreview;
  }, [functionPreview]);
  const updateOrigamiPaperStyle = (
    paperStyleUpdate: Parameters<typeof setOrigamiFunctionPreviewPaperStyle>[1],
  ) =>
    setFunctionPreview((preview) =>
      setOrigamiFunctionPreviewPaperStyle(preview, paperStyleUpdate),
    );

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
      <section
        className="origami-function-panel"
        aria-labelledby="origami-function-title"
      >
        <div>
          <p className="section-label">Function lab</p>
          <h2 id="origami-function-title">Fold-computed function</h2>
        </div>
        <label>
          Origami function
          <input
            aria-label="Origami function"
            value={functionSource}
            onChange={(event) => setFunctionSource(event.target.value)}
            spellCheck={false}
          />
        </label>
        <dl className="origami-function-status" aria-live="polite">
          <div>
            <dt>Sample values</dt>
            <dd>
              {Object.entries(functionValues)
                .map(([name, value]) => `${name}=${value}`)
                .join(", ")}
            </dd>
          </div>
          <div>
            <dt>Domain</dt>
            <dd>
              {functionReport.status === "valid"
                ? "allowable"
                : functionReport.status === "blocked"
                  ? "blocked"
                  : "parse error"}
            </dd>
          </div>
          <div>
            <dt>Variables</dt>
            <dd>{functionVariables.join(", ") || "none"}</dd>
          </div>
          <div>
            <dt>Sample result</dt>
            <dd className="origami-copy-row">
              <span>{functionValue}</span>
              <button
                type="button"
                aria-label="Copy sampled result"
                onClick={() =>
                  void copyOrigamiReadout(
                    "sampled result",
                    sampledFunctionReadout,
                  )
                }
                disabled={!sampledFunctionReadout}
              >
                Copy
              </button>
            </dd>
          </div>
          <div>
            <dt>Domain detail</dt>
            <dd>{functionIssueDetail}</dd>
          </div>
          <div>
            <dt>Result label</dt>
            <dd className="origami-copy-row">
              <span>{functionDisplayName}</span>
              <button
                type="button"
                aria-label="Copy result label"
                onClick={() =>
                  void copyOrigamiReadout("result label", functionDisplayName)
                }
                disabled={functionReport.status === "parse-error"}
              >
                Copy
              </button>
            </dd>
          </div>
          <div>
            <dt>Plan</dt>
            <dd>
              {functionPreview.status === "compiled"
                ? functionPreview.plan.id
                : "blocked"}
            </dd>
          </div>
          <div>
            <dt>Animation</dt>
            <dd>
              {functionPreview.status === "compiled"
                ? `${functionPreview.animation.phaseId} @ ${functionPreview.animation.progress.toFixed(2)}`
                : "not started"}
            </dd>
          </div>
          <div>
            <dt>Fold solver</dt>
            <dd>
              {solverReadiness
                ? solverReadiness.status === "ready"
                  ? "ready"
                  : `${solverReadiness.fallbackPhases}/${solverReadiness.totalPhases} fallback phases, ${solverReadiness.certifiedPhases} certified`
                : "not compiled"}
            </dd>
          </div>
          {solverReadiness && (
            <div>
              <dt>Solver detail</dt>
              <dd>{solverReadiness.summary}</dd>
            </div>
          )}
          {nextSolverWorkItem && (
            <div>
              <dt>Next solver item</dt>
              <dd>{`${nextSolverWorkItem.phaseId} ${nextSolverWorkItem.phaseKind} ${nextSolverWorkItem.requiredCapability}`}</dd>
            </div>
          )}
          {activeSolverWorkItem && (
            <>
              <div>
                <dt>Active solver item</dt>
                <dd>{`${activeSolverWorkItem.replacementFor} ${activeSolverWorkItem.selectedBranchId ?? "no branch"}`}</dd>
              </div>
              <div>
                <dt>Active solver detail</dt>
                <dd>{activeSolverWorkItem.summary}</dd>
              </div>
              <div>
                <dt>Solver inputs</dt>
                <dd>
                  {activeSolverWorkItem.sourceObjectIds.join(", ") || "none"}
                </dd>
              </div>
              <div>
                <dt>Solver outputs</dt>
                <dd>{activeSolverWorkItem.outputObjectIds.join(", ")}</dd>
              </div>
            </>
          )}
          {activeFoldCertificate && (
            <>
              <div>
                <dt>Active certificate</dt>
                <dd>{`${activeFoldCertificate.method} ${activeFoldCertificate.targetObjectIds.join(", ")}`}</dd>
              </div>
              <div>
                <dt>Certificate detail</dt>
                <dd>{activeFoldCertificate.summary}</dd>
              </div>
            </>
          )}
          {copiedFunctionReadout && (
            <div>
              <dt>Clipboard</dt>
              <dd>{copiedFunctionReadout}</dd>
            </div>
          )}
        </dl>
        <div className="origami-function-actions">
          <button
            type="button"
            onClick={compileOrigamiFunction}
            disabled={!canCompileOrigamiFunction}
          >
            Compile origami function
          </button>
          <button
            type="button"
            onClick={previewOrigamiFunctionAnimation}
            disabled={
              !canCompileOrigamiFunction ||
              functionPreview.status !== "compiled"
            }
          >
            Preview fold animation
          </button>
        </div>
        <div
          className="origami-function-examples"
          aria-label="Origami function examples"
        >
          {origamiFunctionExamples.map((example) => (
            <button
              key={example.displaySource}
              type="button"
              aria-label={`${example.title} ${example.displaySource}`}
              onClick={() => selectOrigamiFunctionExample(example)}
            >
              <span>{example.title}</span>
              <code>{example.displaySource}</code>
            </button>
          ))}
        </div>
        {variableControls.length > 0 && (
          <fieldset className="origami-variable-controls">
            <legend>Sample variables</legend>
            {variableControls.map((control) => (
              <label key={control.name}>
                <span>{control.name}</span>
                <input
                  aria-label={`${control.name} sample slider`}
                  type="range"
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  value={control.value}
                  onChange={(event) =>
                    updateOrigamiVariable(
                      control.name,
                      Number(event.target.value),
                    )
                  }
                />
                <input
                  aria-label={`${control.name} sample value`}
                  type="number"
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  value={control.value}
                  onChange={(event) =>
                    updateOrigamiVariable(
                      control.name,
                      Number(event.target.value),
                    )
                  }
                />
              </label>
            ))}
          </fieldset>
        )}
      </section>
      <section
        className="origami-function-animation-panel"
        aria-labelledby="origami-function-animation-title"
      >
        <div>
          <p className="section-label">Fold animation</p>
          <h2 id="origami-function-animation-title">Function fold preview</h2>
        </div>
        <aside
          className="origami-function-comparison"
          aria-label="Static crease-pattern comparison"
        >
          <h3>Static crease pattern</h3>
          <p>{examples[exampleIndex].title}</p>
          <a href="#origami-trace">View trace</a>
        </aside>
        <SvgOrigamiFunctionAnimation
          preview={functionPreview}
          svgRef={functionAnimationSvgRef}
        />
        <div className="origami-function-export-controls">
          <button
            type="button"
            disabled={timelineDisabled}
            onClick={() => {
              const json = origamiFunctionAnimationJson(
                functionPreview,
                new Date().toISOString(),
              );
              if (!json) return;
              downloadText(
                "origami-function-animation.json",
                json,
                "application/json",
              );
            }}
          >
            Export function animation JSON
          </button>
          <button
            type="button"
            disabled={timelineDisabled}
            onClick={() =>
              functionAnimationSvgRef.current &&
              downloadText(
                "origami-function-current.svg",
                serializeSvg(functionAnimationSvgRef.current),
                "image/svg+xml",
              )
            }
          >
            Export function current SVG
          </button>
          <button
            type="button"
            disabled={timelineDisabled}
            onClick={() =>
              finalFunctionAnimationSvgRef.current &&
              downloadText(
                "origami-function-final.svg",
                serializeSvg(finalFunctionAnimationSvgRef.current),
                "image/svg+xml",
              )
            }
          >
            Export function final SVG
          </button>
        </div>
        <div className="origami-function-export-renderer" aria-hidden="true">
          <SvgOrigamiFunctionAnimation
            preview={finalFunctionPreview}
            svgRef={finalFunctionAnimationSvgRef}
          />
        </div>
        <fieldset className="origami-paper-style-controls">
          <legend>Paper style</legend>
          <label>
            Front
            <input
              aria-label="Function paper front color"
              type="color"
              disabled={timelineDisabled}
              value={paperStyle?.frontColor ?? "#f7f0d4"}
              onChange={(event) =>
                updateOrigamiPaperStyle({ frontColor: event.target.value })
              }
            />
          </label>
          <label>
            Back
            <input
              aria-label="Function paper back color"
              type="color"
              disabled={timelineDisabled}
              value={paperStyle?.backColor ?? "#365f91"}
              onChange={(event) =>
                updateOrigamiPaperStyle({ backColor: event.target.value })
              }
            />
          </label>
          <label>
            Front pattern
            <select
              aria-label="Function paper front pattern"
              disabled={timelineDisabled}
              value={paperStyle?.frontPattern ?? "grid"}
              onChange={(event) =>
                updateOrigamiPaperStyle({
                  frontPattern: event.target.value as OrigamiPaperPattern,
                })
              }
            >
              <option value="solid">Solid</option>
              <option value="grid">Grid</option>
              <option value="dots">Dots</option>
              <option value="diagonal-stripe">Diagonal stripe</option>
              <option value="washi-wave">Washi wave</option>
              <option value="coordinate-grid">Coordinate grid</option>
              <option value="high-contrast">High contrast</option>
            </select>
          </label>
          <label>
            Back pattern
            <select
              aria-label="Function paper back pattern"
              disabled={timelineDisabled}
              value={paperStyle?.backPattern ?? "diagonal-stripe"}
              onChange={(event) =>
                updateOrigamiPaperStyle({
                  backPattern: event.target.value as OrigamiPaperPattern,
                })
              }
            >
              <option value="solid">Solid</option>
              <option value="grid">Grid</option>
              <option value="dots">Dots</option>
              <option value="diagonal-stripe">Diagonal stripe</option>
              <option value="washi-wave">Washi wave</option>
              <option value="coordinate-grid">Coordinate grid</option>
              <option value="high-contrast">High contrast</option>
            </select>
          </label>
          <label>
            Crease
            <input
              aria-label="Function crease color"
              type="color"
              disabled={timelineDisabled}
              value={paperStyle?.creaseColor ?? "#e8b65c"}
              onChange={(event) =>
                updateOrigamiPaperStyle({ creaseColor: event.target.value })
              }
            />
          </label>
          <label>
            Highlight
            <input
              aria-label="Function highlight color"
              type="color"
              disabled={timelineDisabled}
              value={paperStyle?.highlightColor ?? "#fff2bb"}
              onChange={(event) =>
                updateOrigamiPaperStyle({ highlightColor: event.target.value })
              }
            />
          </label>
          <label>
            Opacity
            <input
              aria-label="Function paper opacity"
              type="range"
              min="0.2"
              max="1"
              step="0.05"
              disabled={timelineDisabled}
              value={paperStyle?.opacity ?? 1}
              onChange={(event) =>
                updateOrigamiPaperStyle({ opacity: Number(event.target.value) })
              }
            />
          </label>
          <label>
            Pattern scale
            <input
              aria-label="Function paper pattern scale"
              type="range"
              min="0.5"
              max="3"
              step="0.25"
              disabled={timelineDisabled}
              value={paperStyle?.patternScale ?? 1}
              onChange={(event) =>
                updateOrigamiPaperStyle({
                  patternScale: Number(event.target.value),
                })
              }
            />
          </label>
          <label>
            Pattern rotation
            <input
              aria-label="Function paper pattern rotation"
              type="range"
              min="0"
              max="360"
              step="15"
              disabled={timelineDisabled}
              value={paperStyle?.patternRotation ?? 0}
              onChange={(event) =>
                updateOrigamiPaperStyle({
                  patternRotation: Number(event.target.value),
                })
              }
            />
          </label>
        </fieldset>
        <div
          className="origami-function-timeline"
          aria-label="Origami function timeline"
          aria-keyshortcuts="ArrowLeft ArrowRight Space"
          tabIndex={0}
          onKeyDown={(event) => {
            if (timelineDisabled) return;
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              setFunctionPreview((preview) =>
                stepOrigamiFunctionPreviewPhase(preview, -1),
              );
            }
            if (event.key === "ArrowRight") {
              event.preventDefault();
              setFunctionPreview((preview) =>
                stepOrigamiFunctionPreviewPhase(preview, 1),
              );
            }
            if (event.key === " ") {
              event.preventDefault();
              setFunctionPreview((preview) =>
                setOrigamiFunctionPreviewPlaying(
                  preview,
                  preview.status !== "compiled" || !preview.animation.playing,
                ),
              );
            }
          }}
        >
          <button
            type="button"
            aria-label="Previous function phase"
            disabled={timelineDisabled}
            onClick={() =>
              setFunctionPreview((preview) =>
                stepOrigamiFunctionPreviewPhase(preview, -1),
              )
            }
          >
            Prev
          </button>
          <button
            type="button"
            aria-label={
              functionPreview.status === "compiled" &&
              functionPreview.animation.playing
                ? "Pause function animation"
                : "Play function animation"
            }
            disabled={timelineDisabled}
            onClick={() =>
              setFunctionPreview((preview) =>
                setOrigamiFunctionPreviewPlaying(
                  preview,
                  preview.status !== "compiled" || !preview.animation.playing,
                ),
              )
            }
          >
            {functionPreview.status === "compiled" &&
            functionPreview.animation.playing
              ? "Pause"
              : "Play"}
          </button>
          <button
            type="button"
            aria-label="Next function phase"
            disabled={timelineDisabled}
            onClick={() =>
              setFunctionPreview((preview) =>
                stepOrigamiFunctionPreviewPhase(preview, 1),
              )
            }
          >
            Next
          </button>
          <label>
            Scrub
            <input
              aria-label="Function animation progress"
              type="range"
              min="0"
              max="1"
              step="0.01"
              disabled={timelineDisabled}
              value={
                functionPreview.status === "compiled"
                  ? functionPreview.animation.progress
                  : 0
              }
              onChange={(event) =>
                setFunctionPreview((preview) =>
                  setOrigamiFunctionPreviewProgress(
                    preview,
                    Number(event.target.value),
                  ),
                )
              }
            />
          </label>
          <label>
            Speed
            <select
              aria-label="Function animation speed"
              disabled={timelineDisabled}
              value={
                functionPreview.status === "compiled"
                  ? functionPreview.animation.speed
                  : 1
              }
              onChange={(event) =>
                setFunctionPreview((preview) =>
                  setOrigamiFunctionPreviewSpeed(
                    preview,
                    Number(event.target.value),
                  ),
                )
              }
            >
              <option value="0.5">0.5x</option>
              <option value="1">1x</option>
              <option value="2">2x</option>
              <option value="4">4x</option>
            </select>
          </label>
          <label>
            Reduced motion
            <input
              aria-label="Function reduced motion"
              type="checkbox"
              disabled={timelineDisabled}
              checked={
                functionPreview.status === "compiled"
                  ? functionPreview.animation.reducedMotion
                  : false
              }
              onChange={(event) =>
                setFunctionPreview((preview) =>
                  setOrigamiFunctionPreviewReducedMotion(
                    preview,
                    event.target.checked,
                  ),
                )
              }
            />
          </label>
        </div>
        {solverReadiness && solverReadiness.workItems.length > 0 && (
          <section
            className="origami-function-solver-work"
            aria-labelledby="origami-function-solver-work-title"
          >
            <h3 id="origami-function-solver-work-title">Solver work backlog</h3>
            <ol>
              {solverReadiness.workItems.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-label={`Jump to solver work ${item.phaseId}`}
                    aria-current={
                      functionPreview.status === "compiled" &&
                      item.phaseId === functionPreview.animation.phaseId
                        ? "step"
                        : undefined
                    }
                    disabled={timelineDisabled}
                    onClick={() =>
                      setFunctionPreview((preview) =>
                        setOrigamiFunctionPreviewPhase(preview, item.phaseId),
                      )
                    }
                  >
                    <span>{item.phaseId}</span>
                    <span>{`${item.phaseKind} · ${item.requiredCapability}`}</span>
                  </button>
                </li>
              ))}
            </ol>
          </section>
        )}
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
                setSelectedProofClaimId(undefined);
                setHoveredProofClaimId(undefined);
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
              onSelectObject={selectOrigamiObject}
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
                      onClick={() => {
                        setProofId(step.proofId);
                        setSelectedProofClaimId(undefined);
                        setHoveredProofClaimId(undefined);
                      }}
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
                <dt>Assumptions</dt>
                <dd>
                  {selectedObjectProof?.assumptions?.join("; ") ?? "none"}
                </dd>
                <dt>Selected</dt>
                <dd>
                  {selectedBranch?.label ??
                    selectedObjectStep?.selectedSolutionId ??
                    "deterministic"}
                </dd>
                <dt>Rejected</dt>
                <dd>
                  {rejectedBranches.length
                    ? rejectedBranches.map(({ label }) => label).join(", ")
                    : "none"}
                </dd>
                <dt>Sample</dt>
                <dd>{sampledOrigamiValue()}</dd>
                <dt>Provenance</dt>
                <dd>
                  {selectedObject.provenance.sourceObjectIds.length
                    ? selectedObject.provenance.sourceObjectIds.join(", ")
                    : "none"}
                </dd>
                <dt>Export IDs</dt>
                <dd>
                  {[selectedObject.id, selectedObjectStep?.id]
                    .filter(Boolean)
                    .join(", ")}
                </dd>
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
                <button
                  type="button"
                  onClick={() => {
                    setProofId(undefined);
                    setSelectedProofClaimId(undefined);
                    setHoveredProofClaimId(undefined);
                  }}
                >
                  Close
                </button>
              </header>
              <p>{activeProof.intuition}</p>
              <ul>
                {activeProof.claims.map((claim) => (
                  <li key={claim.id}>
                    <button
                      type="button"
                      className="origami-proof-claim"
                      aria-pressed={claim.id === selectedProofClaimId}
                      onClick={() => setSelectedProofClaimId(claim.id)}
                      onMouseEnter={() => setHoveredProofClaimId(claim.id)}
                      onMouseLeave={() => setHoveredProofClaimId(undefined)}
                    >
                      <span>{claim.text}</span>
                      <code>{claim.highlightObjectIds.length} objects</code>
                    </button>
                  </li>
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
