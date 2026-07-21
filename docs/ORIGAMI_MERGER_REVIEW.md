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

- Parsed expression AST as the input boundary.
- Sampled numeric values for examples and tests.
- Arithmetic operation family names.
- Result provenance tied back to formatted expressions.
- Proof references attached to generated work.
- JSON-safe scene and function-preview data.

## Similar but Not Identical

These concepts should stay separate until more evidence accumulates:

- Step and phase models.
- Proof cards versus fold certificates and solver readiness.
- Object provenance fields and object namespaces.
- Progressive reveal versus fold animation playback.
- Export controls and exported metadata.

## System-Specific Concepts

These should not be hidden behind a shared abstraction yet:

- Huzita-Hatori axiom selection and branch ordering.
- Mountain/valley assignment and side exposure.
- Fold degeneracy categories and physical solver backlog.
- Compass circle/ray/arc construction scaffolding.
- Clean final compass construction extraction.
- Origami paper styling, crease-pattern export, animated SVG export, import
  replay, fold camera, onion-skin ghosts, visual cues, minimap, challenges,
  presentation mode, and palette randomizer.

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
