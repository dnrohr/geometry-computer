# Origami Merger Readiness Review

Status: keep the compass-and-straightedge and flat-origami workspaces separate.

This review compares the original compass-and-straightedge geometry computer
with the flat-origami function lab. The goal is to identify what can stay
aligned, what is merely similar, and what must remain system-specific until both
systems can compute, render, inspect, prove, animate, and export the same
function families without weakening either explanation model.

## Evidence

Compatibility coverage lives in `src/domain/mergerReadiness.test.ts`.

The current tests compare:

- `a+b` through `compileExpression`, the compass-and-straightedge compiler, and
  `compileOrigamiExpression`, the flat-origami scene compiler.
- `sqrt(a+1)` through `compileExpression` and
  `compileOrigamiFunctionPreview`, the origami function-lab preview compiler.
- The written F8.1 headings in this document, so the review cannot silently lose
  a required comparison category before shared abstractions are extracted.

## F8.1 Comparison

### Function Parsing and Expression Normalization

Shared evidence:

- Both systems can accept the same parsed expression AST from
  `parseExpression`.
- Both systems preserve the original mathematical expression as a user-facing
  label.

Important difference:

- Compass-and-straightedge compilation receives a parsed AST plus caller-supplied
  original and simplified strings.
- The origami function lab owns a signature-aware parser boundary. It accepts
  freeform expressions and signatures such as `f(a)=sqrt(a+1)`, validates that
  signature variables match expression variables, and normalizes display text
  such as `f(a) = sqrt(a + 1)`.

Merge judgment: expression parsing is the only shared production boundary today.
Function signatures and normalized function labels should remain origami-local
until the compass workspace has an equivalent function-lab surface.

### Sampled Values

Shared evidence:

- Both systems evaluate sampled variables into a numeric result before rendering.
- Compatibility tests prove `a+b` evaluates to `5` for `a=3`, `b=2`, and
  `sqrt(a+1)` evaluates to `2` for `a=3`.

Important difference:

- Compass sampled values feed geometric construction macros and final SVG
  geometry.
- Origami function sampled values also drive allowable-field validation, variable
  controls, function share text, plan phase generation, and paper-style-aware
  animation previews.

Merge judgment: sampled value records can stay shape-compatible, but validation
messages and UI state should not be shared yet.

### Operation Traces

Shared evidence:

- Both systems expose operation-level arithmetic intent. Compass steps use
  operation names such as `add` and `sqrt`; origami function plans use operation
  kinds such as `add-lengths` and `extract-square-root`.

Important difference:

- Compass traces distinguish macro and primitive Euclidean construction steps.
- Origami function plans distinguish nodes, operations, dependency jump targets,
  length transfers, result extraction, physical fold phases, and solver work
  items.

Merge judgment: operation names should stay aligned in tests and documentation,
but a shared operation-trace interface would hide too much currently useful
system-specific detail.

### Proof Claims

Shared evidence:

- Both systems attach proof information to generated work.
- Compass steps can reference operation proof cards.
- Origami phases can reference proof claims and fold certificates.

Important difference:

- Compass proofs justify Euclidean macro constructions such as similar-triangle
  multiplication or square-root construction.
- Origami proof evidence is split between fold certificates, branch selections,
  physical solver readiness, and fallback solver work.

Merge judgment: proof-card UI patterns may be compared later, but proof data
should remain separate until origami fallback phases are replaced with physical
fold solver support.

### Object Provenance

Shared evidence:

- Both systems preserve result provenance back to formatted expressions.
- Compatibility tests verify the compass result represents `sqrt(a + 1)` and
  the origami function result maps to the plan result-extraction object.
- Object IDs intentionally remain in separate namespaces.

Important difference:

- Compass objects include points, segments, lines, rays, circles, arcs,
  triangles, labels, scaffolding, and clean final result extraction.
- Origami objects include paper boundaries, creases, fold assignments, reflected
  objects, side exposure, and fold-specific selected branches.

Merge judgment: provenance expectations should stay compatible, but object
models should not merge.

### Exports

Shared evidence:

- Both systems produce JSON-safe export data.
- Compass exports include expression, simplified expression, values, geometry,
  steps, reveal actions, and proofs.
- Origami function exports include the full function plan, animation state,
  active phase, solver readiness, paper style, and optional export timestamp.

Important difference:

- Compass SVG export serializes the visible construction and supports a clean
  final construction view.
- Origami function exports include current/final SVG snapshots, crease-pattern
  SVG, deterministic animated SVG, and replayable JSON animation state.

Merge judgment: export buttons can remain visually similar, but export schemas
and helpers should stay separate.

### Animation Timelines

Shared evidence:

- Both systems expose progressive visual state.
- Compass construction reveal actions and origami function phases are both
  testable, deterministic sequences.

Important difference:

- Compass reveal progress is a rendering reveal over construction objects.
- Origami function animation has phase IDs, playback speed, reduced-motion
  handling, fold camera modes, onion-skin ghosts, visual cues, a phase minimap,
  presentation mode, and paper style.

Merge judgment: no shared timeline abstraction yet. The origami function
timeline is core to explaining computation-by-folding, while compass reveal
state is a construction-reading aid.

## Shared Concepts

These concepts are compatible enough to keep aligned:

- Parsed expression AST: Both systems already consume the same parser output
  before choosing a construction model.
- Sampled numeric values: Both compilers use sample values to evaluate the
  expression and validate expected results.
- Arithmetic operation family names: Operation families such as addition and
  square root stay comparable in tests and docs.
- Result expression provenance: Both systems tie the displayed result back to a
  formatted expression.
- JSON-safe generated data: Both paths can serialize generated scenes or
  function previews without UI-only state.

## Similar but Not Identical

These concepts should stay separate until more evidence accumulates:

- Step and phase models: Compass steps describe macro and primitive construction
  levels; origami phases describe fold computation and solver readiness.
- Proof references: Compass proof cards and origami fold certificates both
  justify work, but they cite different mathematical objects.
- Object provenance fields: Both preserve provenance, while compass and origami
  object namespaces and metadata differ.
- Progressive visual state: Compass reveal progress and origami fold playback
  are deterministic, but they explain different actions.
- Export controls: Both expose JSON and SVG-style exports, while their schemas
  and replay semantics remain different.

## System-Specific Concepts

These should not be hidden behind a shared abstraction yet:

- Huzita-Hatori axiom selection: Fold axiom choice and branch ordering only
  belong to the origami solver path.
- Mountain/valley assignment and side exposure: Paper orientation is essential
  to folds and has no compass-and-straightedge equivalent.
- Compass construction scaffolding: Circles, rays, arcs, triangles, and clean
  final extraction are Euclidean construction concerns.
- Origami function animation controls: Fold camera, onion-skin ghosts, cues,
  minimap, presentation mode, replay, and paper palettes explain
  folding-specific computation.
- Physical fold solver backlog: Fallback phases and required fold-solver
  capabilities are origami-only readiness data.

## F8.3 Compatibility Gates

No shared function-plan, proof-card, export, or expression-control interface
should be extracted until its paired compatibility tests exist.

- function-plan: blocked-until-tested.
  Compass plans must prove operation order, macro/primitive step links, object
  provenance, and reveal actions.
  Origami plans must prove node order, operation phases, fold certificates,
  solver readiness, and result extraction.
  A shared function-plan interface needs one test that compiles the same
  function through both systems and asserts the shared fields without hiding
  system-specific details.
- proof-card: blocked-until-tested.
  Compass proof cards must prove Euclidean macro assumptions, givens, claims,
  highlighted objects, and conclusions.
  Origami proof cards must prove fold claims, fold certificates, branch choices,
  fallback status, and highlighted crease objects.
  A shared proof-card interface needs paired tests that open a compass proof and
  an origami proof for the same arithmetic family.
- export: blocked-until-tested.
  Compass exports must prove JSON scene data, visible SVG export, and clean
  final SVG export.
  Origami exports must prove function-animation JSON, replay, current/final SVG
  snapshots, crease-pattern SVG, and animated SVG.
  A shared export interface needs schema tests for both export families and
  browser smoke coverage for both download flows.
- expression-control: blocked-until-tested.
  Compass expression controls must prove expression input, sample variables,
  gallery loading, validation, and compile behavior.
  Origami expression controls must prove function signatures, allowable-field
  validation, variable controls, examples, challenges, and share text.
  A shared expression-control interface needs UI tests that exercise both
  workspaces without removing either system's labels or validation states.

## Decision

Do not merge the compiler, renderer, export, or proof paths yet. The only shared
production boundary remains expression parsing.

A shared operation-trace interface may be worth revisiting after both systems
have comparable support for at least one full function family, including
rendered intermediate geometry, proof depth, exports, and animation or reveal
semantics. For now, keep the separate tabs. A construction-system selector
should wait until both systems can compile, render, inspect, prove, and export
the same arithmetic family without losing the differences that make each
construction system understandable.
