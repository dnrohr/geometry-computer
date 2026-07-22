# Geometry Computer ROADMAP

Repository: <https://github.com/dnrohr/geometry-computer>

Implementation status: all MVP milestones and acceptance criteria were completed and verified on 2026-06-21. Future ideas in section 14 remain intentionally out of MVP scope.

## Current Product Direction: Flat Origami Computation Track

The next exploratory track is a flat-origami computation roadmap. The top
priority is to avoid modifying the existing compass-and-straightedge
functionality while the origami model is still speculative. New origami work
should live behind a separate tab, use separate fixtures and tests, and avoid
sharing mutable UI/compiler state with the current construction workspace.

Keep an eye toward an eventual merger. Where it is cheap, align names and data
concepts around expression provenance, operation traces, proof references, and
export metadata. Do not extract a shared abstraction merely in anticipation of a
merge; wait until both construction systems have enough implemented behavior to
show the common shape.

### Origami computation roadmap

1. Model folds as first-class operations.
   Define points, creases, reflected objects, alignment constraints, fold
   certificates, Huzita-Hatori axiom templates, selected solutions, and
   degeneracy notes beside the current construction model.
2. Build an origami-only arithmetic trace.
   Compile constants, length copying, addition/subtraction,
   multiplication/division, and square roots into folds without touching the
   current compass-and-straightedge compiler. Treat cubic roots and angle
   trisection as later research spikes after the basic trace is stable.
3. Render crease-pattern explanations.
   Add an SVG viewer for active creases, mountain/valley candidates, reflected
   geometry, selected intersections, extracted lengths, fold proofs, and object
   provenance.
4. Prepare for a shared computation core.
   Compare the origami and compass-straightedge operation traces once at least
   one arithmetic family is implemented and tested in both systems. Merge around
   a construction-system selector only after feature parity and test coverage
   make the convergence low risk.

### Detailed origami task backlog

#### O0. Guardrails and workspace separation

Goal: make it easy to add origami work without accidentally changing existing
compass-and-straightedge behavior.

- O0.1 Keep the compass-and-straightedge workspace mounted under its current tab
  so active construction state survives navigation.
- O0.2 Keep origami UI state under the flat-origami tab until a deliberate merge
  milestone is reached.
- O0.3 Add regression tests that switch between tabs after compiling a
  compass-and-straightedge expression and verify the expression, scene title,
  reveal state, and export controls still behave as before.
- O0.4 Do not import origami domain types into the current compiler, construction
  macros, SVG renderer, proof cards, export helpers, or examples.
- O0.5 Document every intentional shared dependency. The expression parser may
  be shared early; construction trace, rendering, proof, and export models stay
  separate until O4.

Acceptance checks:

- `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build` pass.
- App tests prove tab switching does not reset the current
  compass-and-straightedge construction.
- A search for imports from `domain/origami` inside existing
  compass-and-straightedge modules returns no matches.

#### O1. Origami domain model

Goal: create a deterministic fold scene model that can describe flat-origami
computation independently from compass-and-straightedge construction scenes.

- O1.1 Create `src/domain/origami/types.ts` with origami-specific identifiers
  for points, lines, creases, paper boundary objects, reflected objects, fold
  steps, fold axioms, and fold scenes.
- O1.2 Define fold provenance fields that can later map to expression nodes,
  macro steps, proof claims, and exported object IDs.
- O1.3 Represent mountain/valley assignment as optional metadata, not a solver
  requirement, so early arithmetic traces can remain flat-geometry focused.
- O1.4 Add degeneracy metadata for coincident points, parallel alignments,
  ambiguous folds, no-solution cases, and multiple valid solutions.
- O1.5 Add fixture builders in `src/domain/origami/examples` for simple points,
  creases, reflected points, and single-fold scenes.
- O1.6 Add tests for ID stability, object provenance, scene validation, and
  JSON-safe serializability.

Acceptance checks:

- Origami scene fixtures are deterministic across repeated test runs.
- Invalid fold scenes produce readable errors rather than partially valid scenes.
- No existing construction model type needs to change.

#### O2. Fold axiom templates

Goal: encode Huzita-Hatori folds as deterministic operation templates with clear
preconditions and selected solutions.

- O2.1 Add `src/domain/origami/axioms` for fold operation functions, starting
  with the axioms needed by arithmetic examples rather than all axioms at once.
- O2.2 Implement point-to-point folding: crease is the perpendicular bisector of
  two points.
- O2.3 Implement point-to-line folding: crease maps a point onto a target line
  when solutions exist.
- O2.4 Implement line-to-line folding: crease aligns one line with another,
  including angle-bisector solution selection.
- O2.5 Add the first parabola/tangent style fold only when needed for cubic
  roots or angle trisection research.
- O2.6 Standardize solution ordering and expose the selected solution ID in the
  fold step.
- O2.7 Add tests for normal cases, no-solution cases, coincident inputs,
  parallel lines, and ambiguous multi-solution folds.

Acceptance checks:

- Each axiom template returns fold objects, reflected objects where appropriate,
  and proof metadata.
- Every branch choice is documented in test names or fixture descriptions.
- No UI code is required to test fold geometry.

#### O3. Origami arithmetic trace

Goal: compile a small set of arithmetic expressions into origami-only fold
traces using the existing parser as the input boundary.

- O3.1 Create `src/domain/origami/compiler/compileOrigamiExpression.ts` as a
  separate entry point from `compileExpression`.
- O3.2 Add origami macro types for placing inputs, copying lengths, constants,
  addition, subtraction, multiplication, division, square, and square root.
- O3.3 Implement constants and length copying first, with sampled numeric values
  and expression provenance attached to each result segment.
- O3.4 Implement addition and subtraction using a simple baseline layout that is
  deterministic and easy to inspect.
- O3.5 Implement multiplication and division with fold-based similar-triangle or
  intercept-style constructions.
- O3.6 Implement square and square root once multiplication/division fixtures are
  stable.
- O3.7 Add a separate origami example gallery with one example per supported
  arithmetic family.
- O3.8 Add tests comparing expected numeric output, fold step count, provenance,
  and readable errors for unsupported expressions.
- O3.9 Document cubic root and angle trisection as research spikes, not basic
  arithmetic acceptance criteria.

Acceptance checks:

- Origami expression compilation uses `parseExpression` but not
  `compileExpression`.
- Existing compass-and-straightedge examples and tests remain unchanged.
- Unsupported operations fail with origami-specific errors.

#### O4. Crease-pattern renderer and interaction

Goal: provide an inspectable origami visualization that matches the current app's
interaction quality without sharing mutable state or renderer internals.

- O4.1 Add `src/render/origami/svg/SvgOrigamiCanvas.tsx` for paper boundary,
  creases, reflected points, fold labels, result segments, and active highlights.
- O4.2 Add reveal-state evaluation for origami fold steps in
  `src/domain/origami/reveal`.
- O4.3 Add an origami object inspector that shows object type, provenance,
  selected fold, selected axiom, branch choice, and degeneracy notes.
- O4.4 Add an origami steps panel with active fold selection and keyboard
  traversal.
- O4.5 Add proof cards for the implemented fold axioms and arithmetic macros.
- O4.6 Add export buttons for origami JSON and SVG only after the fold scene
  format is stable.
- O4.7 Add responsive layout tests or visual-contract tests for the origami tab.

Acceptance checks:

- The origami tab renders a nonempty SVG for each gallery example.
- Selecting a fold highlights the crease and related source/result objects.
- Compass-and-straightedge rendering tests continue to pass unchanged.

#### O5. Documentation and math notes

Goal: make the fold model explainable enough that future implementation work is
not trapped in hidden assumptions.

- O5.1 Create `docs/ORIGAMI_DOMAIN_MODEL.md` covering scene objects, fold steps,
  axioms, branch choices, and degeneracy handling.
- O5.2 Create `docs/ORIGAMI_MATH_BACKGROUND.md` with the fold axioms used by the
  app and the arithmetic constructions they support.
- O5.3 Create `docs/ORIGAMI_RENDERING.md` covering crease styles, reflected
  object styles, labels, reveal states, and export expectations.
- O5.4 Update `docs/ARCHITECTURE.md` only to name the separate origami track and
  shared parser boundary.
- O5.5 Update `README.md` when the origami tab moves from roadmap-only to
  interactive examples.

Acceptance checks:

- Each implemented axiom or macro has a matching documentation entry.
- Documentation clearly marks research spikes separately from supported
  features.
- Architecture docs still state that compiler, renderer, and export paths are
  separate until O6.

#### O6. Merger readiness review

Goal: decide whether to keep separate workspaces or introduce shared
computation-facing abstractions based on implemented evidence.

- O6.1 Compare compass-and-straightedge and origami traces for one completed
  arithmetic family, such as addition or square root.
- O6.2 Identify identical concepts, similar concepts with different semantics,
  and concepts that must remain system-specific.
- O6.3 Add compatibility tests before extracting shared interfaces.
- O6.4 Extract shared proof-card or operation-trace interfaces only if both
  systems already satisfy the same test contract.
- O6.5 Add a construction-system selector only after both systems can compile,
  render, inspect, prove, and export at least one common arithmetic family.
- O6.6 Keep the separate tabs if the shared layer would hide important
  differences in fold versus compass-straightedge reasoning.

Acceptance checks:

- Merger work has a written comparison document before code is moved.
- Shared interfaces have tests from both systems.
- The user can still use the original compass-and-straightedge flow exactly as
  before.

### Next origami milestones

These follow-on milestones assume O0-O6 are complete. They keep the flat-origami
track separate from compass-and-straightedge behavior while adding enough
mathematical and visual evidence to make a future merge decision less
speculative.

#### N1. Rich fold geometry for arithmetic traces

Goal: replace placeholder-style arithmetic traces with inspectable geometric
constructions whose intermediate objects explain why the numeric result follows
from the folds.

- N1.1 Define a macro trace contract for advanced origami arithmetic that records
  source segments, unit references, guide lines, fold creases, reflected objects,
  selected intersections, result segments, proof claim IDs, branch selections,
  and degeneracy notes.
  Current implementation adds `OrigamiArithmeticMacroTrace` on origami fold
  steps with those object-reference slots, proof claim IDs, selected branch
  metadata, and degeneracy object references.
- N1.2 Expand multiplication into a full similar-triangle or intercept-theorem
  construction with visible unit axes, copied input lengths, guide creases,
  projected/scaled points, and a result segment.
  Current implementation emits an intercept-style multiplication trace with a
  unit segment, copied factor segments, ratio and parallel guide lines, selected
  scaled point, projection crease, result segment, and proof branch metadata.
- N1.3 Expand division into a reciprocal or intercept-theorem construction with
  denominator nonzero validation, visible reciprocal geometry, selected branch
  metadata, and a result segment.
  Current implementation emits a reciprocal intercept trace with a nonzero
  denominator check, unit segment, numerator and denominator copies, reciprocal
  and quotient guides, selected reciprocal and quotient points, projection
  crease, result segment, and proof branch metadata.
- N1.4 Implement square as a multiplication specialization that reuses the
  multiplication trace contract while preserving expression provenance for the
  duplicated input.
  Current implementation routes squaring through the multiplication trace shape,
  keeps the copied second factor visible, and preserves provenance for the
  duplicated source length.
- N1.5 Expand square root into a geometric-mean style construction with the
  unit-plus-input baseline, midpoint, auxiliary circle or fold-equivalent guide,
  perpendicular extraction step, selected intersection, and nonnegative-input
  validation.
  Current implementation emits a geometric-mean trace with a nonnegative-input
  check, unit-plus-input baseline, midpoint, fold-equivalent guide, positive
  selected square-root point, perpendicular extraction crease, result segment,
  and proof branch metadata.
- N1.6 Add fixture scenes for multiplication, division, square, and square root
  that expose every intermediate object needed by the renderer and inspector.
  Current implementation adds advanced arithmetic fixtures for multiplication,
  division, square, and square root through the origami arithmetic gallery.
- N1.7 Add deterministic tests for numeric results, intermediate object counts,
  provenance chains, branch choices, and readable degeneracy errors for zero,
  negative, parallel, coincident, and ambiguous cases.
  Current implementation tests numeric outputs, macro object counts,
  provenance, branch choices, division-by-zero, negative square roots, and
  compiler-level no-real-solution/fold-outside-paper errors, plus axiom-level
  parallel/coincident/ambiguous cases.
- N1.8 Update `docs/ORIGAMI_MATH_BACKGROUND.md` and
  `docs/ORIGAMI_DOMAIN_MODEL.md` with the exact construction contracts and the
  assumptions each macro depends on.
  Current implementation documents the advanced macro trace slots,
  multiplication/division/square/square-root construction contracts, branch
  assumptions, parser boundary, and separation from compass-and-straightedge
  modules.

Acceptance checks:

- `compileOrigamiExpression` still shares only the parser boundary with the
  compass-and-straightedge compiler.
- Each advanced arithmetic example has fold steps, source/result objects, proof
  IDs, branch metadata, and deterministic numeric output.
- Searches for `domain/origami` imports inside current compass-and-straightedge
  compiler, renderer, proof, export, and example modules still return no
  matches.
- `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, and
  `npm run format:check` pass.

#### N2. Origami explanation view

Goal: turn the origami tab from a trace viewer into an explanation surface where
users can follow the active fold, see the related objects, and understand the
proof claim attached to each construction step.

- N2.1 Define visual roles for source geometry, guides, active creases,
  mountain/valley candidates, reflected geometry, selected intersections,
  extracted result segments, hidden future objects, and degeneracy warnings.
  Current implementation exports a typed visual-role definition list and derives
  stable `origami-visual-*` classes from active steps, macro traces, reveal
  state, and degeneracy references.
- N2.2 Add active-fold overlays in `SvgOrigamiCanvas` that highlight the crease,
  input objects, reflected objects, intersections, and result segment for the
  selected step.
  Current implementation renders a noninteractive active-fold overlay layer for
  selected macro steps and axiom folds, including active creases, source inputs,
  reflected geometry, selected intersections, and extracted result segments.
- N2.3 Upgrade the origami steps panel so each step shows its macro family,
  fold axiom, branch choice, proof status, and any degeneracy note without
  crowding the layout.
  Current implementation keeps those fields in compact metadata tiles outside
  the step activation button, with readable proof and degeneracy status text.
- N2.4 Add proof-card highlighting so selecting or hovering a proof claim
  highlights the related crease and scene objects, and selecting a scene object
  reveals the matching proof claim.
  Current implementation links proof-claim hover/click to canvas highlights,
  moves proof-claim selection back to the owning fold step, and opens the
  matching proof claim when a scene object is selected.
- N2.5 Refine reveal-state behavior so source and guide objects appear before
  the fold that uses them, while future objects remain visually quiet until their
  step is reached.
  Current implementation introduces macro source and guide objects at the start
  of the active step, keeps future objects visible with low-opacity dim reveal
  state, and tags them with the `hidden-future` visual role until their draw
  action takes over.
- N2.6 Add an inspector section for fold assumptions, selected solution, rejected
  branches, numeric sampled value, expression provenance, and export IDs.
  Current implementation exposes fold assumptions, selected solution or branch,
  rejected branch labels, sampled value, expression/source provenance, and
  object/step export IDs in the origami object inspector.
- N2.7 Add compact desktop and mobile layouts that keep the SVG, step list,
  inspector, and proof cards readable without overlapping text or controls.
- N2.8 Update `docs/ORIGAMI_RENDERING.md` with the visual roles, interaction
  states, and reveal rules used by the implementation.

Acceptance checks:

- Selecting any fold in the origami gallery highlights the crease and every
  related source/result object.
- Selecting an object or proof claim moves focus to the matching step without
  resetting the compass-and-straightedge tab.
- The origami tab renders a nonempty SVG and readable panels for each gallery
  example at desktop and mobile widths.
- Compass-and-straightedge rendering and interaction tests continue to pass
  unchanged.

#### N3. Browser and visual regression checks

Goal: make browser-level confidence routine, especially for tab separation,
nonblank rendering, console stability, and responsive explanation layouts.

- N3.1 Add a browser smoke-test command that starts the Vite app, opens the
  local URL, waits for the app shell, and fails on uncaught errors or unexpected
  console errors.
- N3.2 Add smoke coverage for both tabs: compile a compass-and-straightedge
  expression, switch to the origami tab, switch back, and verify the original
  construction state is still intact.
- N3.3 Add origami gallery smoke coverage that opens every origami example and
  verifies the SVG contains paper geometry, at least one crease, labels, active
  step metadata, and no empty viewport.
- N3.4 Add visual-contract checks for desktop and mobile widths that detect
  overlapping panels, clipped button text, blank SVG output, and missing active
  highlights.
- N3.5 Save deterministic screenshots or image snapshots for the origami tab and
  document where generated artifacts live and which files are ignored by git.
- N3.6 Add export smoke checks for origami JSON and SVG once export controls are
  available, verifying the files contain the same scene IDs shown in the UI.
- N3.7 Document a short manual browser smoke procedure in the roadmap until the
  automated checks cover every required interaction.

Manual browser smoke procedure:

1. Run `npm run smoke:browser`; it starts Vite, opens Chromium, exercises both
   tabs, checks every origami gallery example, validates responsive layout
   contracts, saves ignored screenshots under `.artifacts/browser-smoke/`, and
   verifies origami JSON/SVG exports.
2. Start the app with `npm run dev`, open the local URL, and confirm the
   compass-and-straightedge workspace renders first with the current expression
   input, compile button, construction diagram, step list, inspector, and export
   actions.
3. Compile `a+b`, switch to the flat-origami tab, then switch back and confirm
   the compass expression and constructed `a+b` heading are still intact.
4. In the flat-origami tab, open each example from Input length through Square
   root trace. Confirm the SVG is nonblank, the paper boundary and creases are
   visible, labels are readable, and the steps panel shows Macro, Proof, Branch,
   and Degeneracy metadata.
5. For Multiplication trace, select a fold, open `Why?`, and confirm the active
   crease, selected intersection, extracted result, and proof claim highlights
   are visible at both desktop width and a narrow mobile width.
6. Export origami JSON and SVG from Multiplication trace. Confirm the downloaded
   files include `origami-compiled-scene`, `origami-step-3`, and
   `origami-segment-3`, matching the rendered result segment ID.
7. Keep the browser console open during the pass and treat uncaught errors,
   unexpected console errors, blank panels, clipped controls, or tab-state loss
   as smoke failures.

Acceptance checks:

- The browser smoke command can run locally and in CI without relying on a
  preexisting dev server.
- Smoke failures report whether the issue came from console errors, tab-state
  regression, blank rendering, visual contract failure, or export mismatch.
- The checks cover at least one compass-and-straightedge example and every
  origami gallery example.
- The browser checks pass together with `npm test`, `npm run typecheck`,
  `npm run lint`, `npm run build`, and `npm run format:check`.

### Fold-animation function roadmap

This track turns the separate flat-origami tab into a function-computation lab:
enter a function from the currently allowable constructible field, choose input
values, and watch a colored two-sided paper model fold through the computation.
Keep every milestone behind the flat-origami tab until a later merger-readiness
review proves the compass-and-straightedge workspace can share behavior safely.

#### F0. Scope and safety guardrails

Goal: define the supported function language and protect the existing geometry
computer while animation work is still experimental.

- F0.1 Define "allowable field" for the origami tab as real-valued expressions
  built from variables, rational constants, `+`, `-`, `*`, `/`, powers already
  supported by the parser, square roots, and composition, with domain checks for
  division by zero and negative square-root radicands.
- F0.2 Add a flat-origami function input panel under the origami tab only. Do
  not add new controls to the compass-and-straightedge workspace.
- F0.3 Keep origami function parsing, validation, planning, animation state,
  paper styling, and export types under origami-specific modules.
- F0.4 Reuse the shared expression parser only as the syntax boundary; keep
  compiler, renderer, animation, and proof models separate.
- F0.5 Add regression tests that compile and animate origami functions, switch
  back to compass-and-straightedge, and verify the original construction state
  is unchanged.

Acceptance checks:

- Unsupported syntax and domain failures produce origami-specific messages.
- Searches for `domain/origami` imports in compass compiler, renderer, proof,
  export, and example modules still return no matches.
- Tab switching preserves both origami animation state and compass construction
  state.

#### F1. Function input and sampled domain controls

Goal: let a user type a constructible function and choose sample values that
drive a deterministic fold computation.

- F1.1 Add an origami function input field with examples such as `f(a,b)=a*b`,
  `f(x)=sqrt(x+1)`, and `f(a,b,c)=(a+b)/(c+1)`.
- F1.2 Parse optional function signatures, infer variables when no signature is
  supplied, and normalize display names for the result.
- F1.3 Add variable controls with numeric inputs, steppers, and sliders for
  sampled values, including per-variable min, max, and default values.
- F1.4 Validate the sampled domain before compiling, showing denominator and
  radicand issues inline without crashing the scene.
- F1.5 Preserve example gallery presets, but let each preset populate the new
  function input and sample controls.
- F1.6 Add copyable normalized-expression and sampled-result readouts so users
  can verify what is being computed.

Acceptance checks:

- Every supported expression family can be entered manually and through a
  preset.
- Invalid samples block animation with a readable explanation and leave the last
  valid fold scene visible.
- Tests cover variable inference, signature parsing, domain validation, and
  sampled numeric output.

#### F2. Fold computation plan

Goal: compile a function expression into a stepwise fold plan that can support
animation rather than only static crease-pattern explanation.

- F2.1 Add an origami function-plan model that records expression nodes,
  intermediate values, dependencies, fold operations, reusable length transfers,
  and result extraction.
- F2.2 Topologically order computation steps so animations can play from inputs
  to final output and jump to any dependency.
- F2.3 Split arithmetic macros into animation-ready phases: place paper, mark
  inputs, align fold, preview candidate crease, fold, transfer/reflection, mark
  intersection, extract result.
- F2.4 Record fold direction, hinge line, moving paper region, stationary paper
  region, side exposure, and selected branch for each animated fold.
- F2.5 Add deterministic fallback phases for macros that are not yet physically
  solved, clearly labeling them as explanatory traces rather than proven fold
  sequences.
- F2.6 Add plan diagnostics for reused subexpressions, repeated variables,
  negative directed lengths, branch ambiguity, and accumulated scale.

Acceptance checks:

- Plans are deterministic across repeated runs.
- Every animation phase has stable IDs, source object IDs, output object IDs,
  proof references, and export metadata.
- Tests verify ordering, dependency links, branch metadata, and graceful
  diagnostics for unsupported or ambiguous cases.

#### F3. Fold animation engine

Goal: animate each computation step as a visible fold motion while preserving
the existing inspectable SVG trace.

- F3.1 Add a separate animation renderer for the origami tab, using SVG and CSS
  transforms first; consider HTML canvas or WebGL only if SVG cannot express
  convincing fold motion.
- F3.2 Represent paper as layered polygons with front-side and back-side fills,
  fold hinges, moving panels, shadows, and crease previews.
- F3.3 Animate phase transitions with a timeline model that supports play,
  pause, scrub, previous step, next step, speed control, and reduced-motion
  fallback.
- F3.4 Show the computation value evolving beside the animation, including
  current subexpression, sampled numeric value, and final result.
- F3.5 Keep static crease-pattern inspection available beside or below the
  animation so users can compare motion with the final trace.
- F3.6 Add focus and keyboard support for timeline controls, fold steps, and
  object selection.
- F3.7 Add browser visual-contract checks that ensure animation frames are
  nonblank, paper regions stay within the viewport, and controls do not overlap
  at desktop or mobile widths.

Acceptance checks:

- A supported function can be played from blank paper to final result.
- Scrubbing to any phase produces the same visible state every time.
- Reduced-motion mode replaces motion with stepwise state changes while keeping
  all proof and inspector information accessible.

#### F4. Two-sided paper style system

Goal: make front/back paper sides unmistakable and customizable so fold motion
is easy to follow.

- F4.1 Add a paper-style panel under the origami tab with front color, back
  color, front pattern, back pattern, crease color, highlight color, and opacity
  controls.
- F4.2 Provide pattern presets such as solid, grid, dots, diagonal stripe,
  washi wave, coordinate grid, and high-contrast accessibility mode.
- F4.3 Render front and back sides with distinct fills during animation,
  including edge outlines and subtle shadows at fold hinges.
- F4.4 Add pattern scale and rotation controls so users can tune visibility for
  small or large folds.
- F4.5 Store paper style in origami-local UI state and include it in origami
  animation exports without affecting compass SVG export.
- F4.6 Add contrast checks or visual tests for preset combinations so crease,
  label, and result highlights remain readable.

Acceptance checks:

- Changing paper style updates the origami animation and static preview without
  resetting the function plan.
- Front and back sides remain distinguishable after every fold phase.
- Exported SVG/animation metadata includes the selected paper style.

#### F5. Interactive explanation and proof overlays

Goal: make the animation teach the computation, not merely decorate it.

- F5.1 Add a fold-step storyboard with one card per animation phase, including
  the active subexpression, operation, fold axiom or macro, assumptions, and
  branch choice.
- F5.2 Highlight dependencies when hovering a subexpression, fold step, crease,
  paper region, or proof claim.
- F5.3 Add a "why this fold?" overlay that connects the moving paper motion to
  the arithmetic invariant it preserves.
- F5.4 Show rejected branches and degeneracy warnings directly on the animation
  when the planner records ambiguity.
- F5.5 Add optional measurement labels for input lengths, unit references,
  intermediate values, and final output.
- F5.6 Add a comparison strip that shows expression tree progress alongside the
  fold timeline.

Acceptance checks:

- Selecting any phase highlights the paper region, crease, source values,
  output value, and matching proof claim.
- Users can trace the final result back through all dependencies.
- Proof overlays never reset compass-and-straightedge UI state.

#### F6. Function animation exports

Goal: let users save the fold computation as artifacts they can inspect,
replay, or share.

- F6.1 Export the function plan as JSON with expression, sample values,
  animation phases, paper style, proof links, diagnostics, and result metadata.
  Current export progress includes top-level solver readiness and active-phase
  metadata so a saved animation identifies the visible certified fold or solver
  work item without re-deriving it from the full plan.
- F6.2 Export static SVG snapshots for current phase, final crease pattern, and
  final result view.
  Current implementation exports the visible function-animation phase and a
  final result-phase function SVG from the origami renderer, plus a flattened
  final crease-pattern SVG with per-phase crease provenance.
- F6.3 Add an animated export path such as WebM, GIF, or SVG animation after the
  timeline model is stable.
  Current implementation exports a deterministic standalone animated SVG with
  phase frames, crease reveal timing, paper style, and final result metadata.
- F6.4 Add a compact share text block containing the function, sample values,
  supported-domain assumptions, and result.
  Current implementation adds this block to the function lab with solver
  readiness and active animation phase context plus a copy action.
- F6.5 Add import/replay for a saved origami animation JSON file, scoped to the
  origami tab.
  Current implementation imports saved function-animation JSON by recompiling
  the source and sample values, restoring paper style and phase, and reporting
  replay errors inside the origami function lab.
- F6.6 Extend browser smoke tests to verify function-plan JSON and SVG exports
  contain the same scene, phase, paper-style, and result IDs shown in the UI.

Acceptance checks:

- Exported artifacts are deterministic for the same function, values, and paper
  style.
- Importing a saved origami animation does not touch compass-and-straightedge
  state.
- Browser smoke checks report export mismatch separately from animation,
  rendering, and tab-state failures.

#### F7. Delightful extras after the core path works

Goal: add polish that makes the fold-computation lab feel playful, legible, and
worth exploring while staying honest about mathematical limits.

- F7.1 Add a "fold camera" mode with zoom-to-active-fold, fit-to-paper,
  follow-result, and whole-construction views.
  Current implementation adds whole, paper, active-fold, and result camera
  modes for the visible function-animation SVG.
- F7.2 Add onion-skin ghosts for previous and next fold states so motion is
  easier to understand.
  Current implementation adds an optional onion-skin toggle that renders
  previous and next fold-motion crease ghosts in the visible animation.
- F7.3 Add optional soundless haptic-style visual cues: crease snap, branch
  selected, result extracted, and domain warning.
  Current implementation adds an optional visual-cue toggle that surfaces those
  events from validation status, active fold phase, solver branch metadata, and
  result extraction without changing compiled plans or exports.
- F7.4 Add a step minimap showing where each operation sits in the full
  computation.
  Current implementation adds a compact function-phase minimap with numbered
  operation markers, active-phase state, fallback/proven styling, and direct
  phase jump controls.
- F7.5 Add curated function challenges such as "make 2a+b", "compute a scaled
  reciprocal", and "extract sqrt(a+1)" with expected fold counts.
  Current implementation adds compiler-backed challenge cards for those three
  tasks, each with sample values and expected phase counts verified against the
  generated function plan.
- F7.6 Add a presentation mode that hides editing controls and plays the fold
  proof as a clean teaching sequence.
  Current implementation adds a reversible presentation mode that hides the
  function editor, export/style/timeline controls, resets to the first phase,
  and starts the fold animation with a compact phase status.
- F7.7 Add a paper-style randomizer with named palettes that preserve contrast
  constraints.
  Current implementation adds named paper palettes, a random palette button,
  swatches, and tests that enforce front/back contrast for every curated
  palette.

Acceptance checks:

- Extras are optional and do not obscure the core input, play, inspect, and
  export workflows.
- Presentation and camera modes are keyboard accessible and reversible.
- Challenge examples are backed by the same compiler and tests as freeform
  input.

#### F8. Future merge review

Goal: decide whether the origami function lab should remain a separate tab or
share selected concepts with the original geometry computer.

- F8.1 Compare function parsing, expression normalization, sampled values,
  operation traces, proof claims, object provenance, exports, and animation
  timelines across both systems.
  Current implementation expands `docs/ORIGAMI_MERGER_REVIEW.md` with each
  comparison category and adds compatibility tests for function-lab values,
  provenance, exports, and timeline differences.
- F8.2 Identify which concepts are truly shared, which are merely similar, and
  which must stay system-specific because folds and compass construction explain
  computation differently.
  Current implementation adds a typed concept classification matrix and keeps
  the merger review aligned with shared, similar, and system-specific reasons.
- F8.3 Add compatibility tests before extracting any shared function-plan,
  proof-card, export, or expression-control interfaces.
  Current implementation adds a compatibility-gate matrix for those four
  candidate interfaces and tests that block premature shared-interface modules.
- F8.4 Consider a construction-system selector only after both systems can
  compute, render, inspect, prove, and export the same function family.
  Current implementation adds selector-readiness criteria for compute, render,
  inspect, prove, and export parity and keeps the selector status not-ready.
- F8.5 Keep the separate tab if merging would make fold animation or paper-side
  styling harder to understand.
  Current implementation records a keep-separate decision with protected
  workflows and merge risks for fold animation, paper styling, and compass
  construction.

Acceptance checks:

- A written merge review exists before shared code is extracted.
- Any shared abstraction has tests from both the compass-and-straightedge and
  flat-origami paths.
- Users can still open the original geometry computer and the origami function
  lab independently.

## 0. Working Agreement for Agents

This roadmap is written so individual tasks can be handed to a coding agent with minimal extra context. Treat each milestone or task group as an independently verifiable change.

### Required workflow after every major change

A **major change** means any change that adds a feature, changes data models, adds a new construction macro, changes rendering behavior, changes tests/build tooling, or modifies public documentation.

After every major change:

1. Run the relevant test suite.
2. Run type checking.
3. Run linting/formatting checks.
4. Run the production build.
5. Update documentation for the change.
6. Commit with a clear message.
7. Push to `main`.

Canonical command sequence once the project scripts exist:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check

git status
git add .
git commit -m "<clear imperative commit message>"
git push origin main
```

If a command does not exist yet, add it as part of the tooling milestone before relying on it. If a command fails, fix the failure before committing. Do not push broken code to `main`.

### Agent behavior rules

- Inspect the repository before editing. Do not assume the repo is empty.
- Prefer small, reviewable commits over large rewrites.
- Keep implementation simple unless a task explicitly asks for abstraction.
- Keep all math/construction logic deterministic and testable outside the UI.
- Avoid introducing heavy graphics libraries in the MVP.
- Prefer plain TypeScript, React, SVG, and CSS for the initial implementation.
- Do not implement arbitrary geometric layout solving in the MVP.
- Use canonical templates for each construction operation.
- Preserve object provenance: every rendered object should know which step created it and what expression/construction object it represents.
- Document any mathematical assumptions, branch choices, or degeneracy handling.

---

## 1. Product Vision

Build a web application that compiles algebraic expressions in constructible lengths into readable compass-and-straightedge construction narratives.

The application should feel like a **scroll-driven animated construction proof**:

- The user enters or selects an algebraic expression.
- The system simplifies or normalizes the expression where useful.
- The expression is compiled into arithmetic construction operations.
- Each operation is rendered as a canonical geometric construction.
- Scrolling reveals lines, circles, arcs, intersections, and resulting segments over construction time.
- Hovering or clicking an operation reveals a proof/explanation of why that construction realizes the arithmetic operation.
- Hovering or clicking a geometric object highlights the corresponding construction step, and hovering/clicking a step highlights the relevant geometry.

Initial example:

```text
Inputs: lengths a, b, unit 1
Expression: 3a^2 + 4ab + b^2
Simplified: (3a + b)(a + b)
Construction:
  x = 3a + b
  y = a + b
  r = x * y
Result:
  r = 3a^2 + 4ab + b^2
```

---

## 2. MVP Scope

### In scope for MVP

- Web app using TypeScript and React.
- SVG-based construction rendering.
- Scroll-driven reveal of construction steps.
- Expression examples hardcoded initially, then parsed later.
- Arithmetic construction macros for:
  - given input segment
  - constant integer multiples
  - addition
  - subtraction
  - multiplication
  - division
- Optional after arithmetic MVP:
  - squaring as a named specialization of multiplication
  - square root using the geometric-mean/semicircle construction
- Proof cards for multiplication, division, squaring, and square root.
- Object/step bidirectional highlighting.
- Object inspector showing provenance.
- Clean final result frame.
- Tests for math models, construction DAG generation, and geometry primitives.

### Explicit non-goals for MVP

- No general automated theorem proving.
- No arbitrary Euclidean proposition search.
- No full computer algebra system.
- No arbitrary freeform diagram layout solver.
- No Canvas/WebGL renderer unless SVG proves inadequate.
- No support for cubic roots, transcendental functions, or non-constructible operations.
- No guarantee that every algebraically valid expression has an aesthetically optimal diagram.
- No user accounts, persistence, sharing, or collaboration features.

---

## 3. Recommended Tech Stack

Use this unless the existing repository already has a different compatible stack.

- Vite
- React
- TypeScript
- SVG
- CSS Modules or plain CSS
- Vitest for unit tests
- Testing Library for React component tests
- Playwright for later end-to-end interaction tests
- ESLint
- Prettier

Project scripts should eventually include:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

---

## 4. Core Concepts and Data Model

The main design principle is separation of concerns:

```text
Expression AST
  -> Simplified/normalized expression DAG
  -> Construction DAG
  -> Macro construction trace
  -> Primitive geometry trace
  -> SVG scene graph
  -> Scroll/hover/click interaction state
```

### 4.1 Expression AST

Represents algebraic input independent of geometry.

Suggested types:

```ts
export type Expr =
  | { kind: "const"; value: number }
  | { kind: "var"; name: string }
  | { kind: "add"; left: Expr; right: Expr }
  | { kind: "sub"; left: Expr; right: Expr }
  | { kind: "mul"; left: Expr; right: Expr }
  | { kind: "div"; left: Expr; right: Expr }
  | { kind: "pow"; base: Expr; exponent: number }
  | { kind: "sqrt"; value: Expr };
```

MVP can hardcode example ASTs before implementing a parser.

### 4.2 Algebraic construction nodes

Represents arithmetic operations to be constructed.

```ts
export type ConstructionOpKind =
  | "given"
  | "constant"
  | "add"
  | "sub"
  | "mul"
  | "div"
  | "square"
  | "sqrt";

export type ConstructionNode = {
  id: string;
  kind: ConstructionOpKind;
  label: string;
  expressionLatex: string;
  inputs: string[];
  output: string;
  assumptions?: string[];
};
```

### 4.3 Geometry objects

Every visible object should have identity, role, provenance, and dependencies.

```ts
export type GeomObjectKind =
  | "point"
  | "segment"
  | "line"
  | "ray"
  | "circle"
  | "arc"
  | "path"
  | "label"
  | "triangle"
  | "region";

export type GeomRole =
  | "input"
  | "unit"
  | "active-construction"
  | "scaffold"
  | "intermediate"
  | "result"
  | "proof-highlight"
  | "ghost";

export type GeomObject = {
  id: string;
  kind: GeomObjectKind;
  role: GeomRole;
  label?: string;
  createdByStepId: string;
  usedByStepIds: string[];
  represents?: string;
  dependsOnObjectIds: string[];
  data: unknown;
};
```

### 4.4 Construction steps

Separate macro operations from primitive geometric moves.

```ts
export type ConstructionStep = {
  id: string;
  parentStepId?: string;
  level: "macro" | "primitive";
  title: string;
  summary: string;
  operation?: ConstructionOpKind;
  inputObjectIds: string[];
  outputObjectIds: string[];
  createdObjectIds: string[];
  proofId?: string;
};
```

### 4.5 Reveal actions

Scroll state should not be hardwired to rendering code. It should be data-driven.

```ts
export type RevealAction = {
  id: string;
  stepId: string;
  objectId: string;
  start: number;
  end: number;
  animation:
    | "draw"
    | "fade-in"
    | "fade-out"
    | "pulse"
    | "highlight"
    | "select"
    | "dim";
};
```

The renderer receives:

```ts
{
  objects: GeomObject[];
  steps: ConstructionStep[];
  revealActions: RevealAction[];
  currentProgress: number;
  activeStepId: string;
  highlightedObjectIds: string[];
}
```

---

## 5. Visual and Interaction Requirements

### 5.1 Scroll-driven construction time

Use a sticky SVG canvas and a scrolling step column.

- SVG canvas remains visible while user scrolls.
- Each scroll section corresponds to a macro or primitive step.
- Scroll progress partially draws active lines/arcs/circles.
- Completed objects remain visible or fade according to their role.
- Future objects remain hidden.

### 5.2 Animation conventions

Use consistent animation signatures.

#### Lines and segments

- Animate with SVG path length.
- Use `stroke-dasharray` and `stroke-dashoffset`.
- Draw from defining point toward target point when direction is meaningful.

#### Circles

- First pulse the center point.
- Highlight the radius segment.
- Show faint ghost circle.
- Draw circle around circumference.

#### Arcs

- Draw along arc direction.
- Use arc labels only when needed.

#### Intersections

Treat intersections as events.

- When two objects intersect, briefly highlight both parent objects.
- Show candidate intersection points.
- If multiple intersections exist, display both briefly.
- Select the intended point with a pulse or snap animation.
- Fade unselected branch candidates.
- Create a label only after selection.

#### Segment transfer

- Highlight source segment.
- Show a ghost copy moving or appearing at target location.
- Commit the copied segment.
- Label endpoint if the copy creates a named value.

### 5.3 Bidirectional highlighting

Hover/click on diagram object:

- Highlight object.
- Highlight creating step.
- Highlight expression node if present.
- Show object inspector.

Hover/click on construction step:

- Highlight all inputs and outputs for that step.
- Dim unrelated scaffolding.
- Show proof card if the step has one.

Hover/click on expression tree node:

- Highlight all construction steps that produce or use that expression.
- Highlight final represented segment if already constructed.

### 5.4 Proof cards

Proof cards are attached to macro operations, not primitive steps.

Each proof card should include:

- Operation name.
- Inputs.
- Construction idea.
- Key geometric invariant.
- Algebraic conclusion.
- Assumptions/degeneracies.

Proof claims should be linked to diagram highlights.

```ts
export type OperationProof = {
  id: string;
  title: string;
  operation: ConstructionOpKind;
  intuition: string;
  givens: string[];
  claims: ProofClaim[];
  conclusion: string;
  assumptions?: string[];
};

export type ProofClaim = {
  id: string;
  text: string;
  mathLatex?: string;
  highlightObjectIds: string[];
};
```

### 5.5 Inspector

Clicking any object should reveal:

```text
Object: Z
Kind: point
Defined by: intersection of line l3 and ray m
Created in: Step 4.5
Represents: r = x * y
Depends on: x, y, unit 1
Used by: final result extraction
```

### 5.6 Clean final frame

Every construction should end with a clean summary:

- Inputs visible.
- Final result segment visible.
- Essential construction objects optionally visible.
- Scaffolding hidden or strongly dimmed.
- Algebraic equality displayed.

---

## 6. Canonical Construction Templates

Use canonical layouts. Do not attempt arbitrary automatic layout in the MVP.

### 6.1 Common coordinate setup

Represent a numeric example on an SVG coordinate plane.

- Use a main number line for values.
- Choose origin `O`.
- Choose unit point `U` so `OU = 1`.
- Use directed lengths along the main number line.
- Use an auxiliary ray for multiplication/division.
- Use fixed templates for each operation.

The numeric rendering is illustrative. The construction trace is the mathematical artifact.

### 6.2 Given length

Inputs:

- variable name, e.g. `a`
- sample numeric value for rendering

Output:

- segment on the number line or input palette

Acceptance criteria:

- Input segment appears with label.
- Input segment has provenance.
- Input segment can be highlighted from the step list.

### 6.3 Addition: `r = x + y`

Construction idea:

- Copy segment `y` so it starts at the endpoint of `x`.
- Endpoint becomes `r`.

Macro steps:

1. Highlight `x`.
2. Highlight/copy `y`.
3. Lay copied `y` after `x` on the number line.
4. Mark endpoint `r`.

Proof:

```text
If OX = x and XR = y, then OR = OX + XR = x + y.
```

Tests:

- Numeric output coordinate equals `x + y` within tolerance.
- Step trace contains source, copied segment, endpoint, and result label.

### 6.4 Subtraction: `r = x - y`

Construction idea:

- Copy `y` backward from endpoint of `x`.
- Endpoint becomes `r`.

Proof:

```text
If OX = x and RX = y, then OR = OX - RX = x - y.
```

Requirements:

- Support negative output visually as directed length left of origin.
- Document behavior when result is negative.

### 6.5 Multiplication: `r = x * y`

Construction idea:

- Use similar triangles to scale `y` by `x / 1`.

Canonical template:

- `O`, `U`, and `X` on main number line.
- `OU = 1`.
- `OX = x`.
- `Y` on auxiliary ray with `OY = y`.
- Draw line `UY`.
- Draw line through `X` parallel to `UY`.
- Intersection with auxiliary ray gives `Z` where `OZ = xy`.
- Copy `OZ` back to main result line as `r`.

Proof invariant:

```text
Triangles OXZ and OUY are similar.
OZ / OY = OX / OU.
OZ / y = x / 1.
OZ = xy.
```

Requirements:

- Multiplication proof card highlights `OU`, `OX`, `OY`, `OZ`, `UY`, parallel line, and the two triangles.
- Intersections are animated as events.
- Final result is extracted to a clean result segment.

### 6.6 Squaring: `r = x^2`

Construction idea:

- Special case of multiplication where both inputs are `x`.

Proof invariant:

```text
OZ / x = x / 1.
OZ = x^2.
```

Requirements:

- May reuse multiplication geometry.
- Must have separate operation badge and proof card.
- Should display as `square` in the operation tree rather than generic multiplication if expression originated as `x^2`.

### 6.7 Division: `r = x / y`

Construction idea:

- Use similar triangles to rescale `x` by `1 / y`.

Proof invariant:

```text
Construct triangles so OR / OU = OX / OY.
Given OU = 1, OX = x, OY = y.
Then OR / 1 = x / y.
Therefore OR = x / y.
```

Requirements:

- Detect and report `y = 0` as undefined.
- Do not render invalid division as if defined.
- Proof card must include assumption `y ≠ 0`.

### 6.8 Square root: `r = sqrt(x)`

Construction idea:

- Use the geometric mean construction.

Canonical template:

- Place `AB = 1` and `BC = x` consecutively on a line.
- Draw semicircle with diameter `AC`.
- Erect perpendicular at `B`.
- Let it meet semicircle at `D`.
- Then `BD = sqrt(x)`.

Proof invariant:

```text
Angle ADC is right because it subtends a diameter.
BD is the altitude to the hypotenuse.
BD^2 = AB * BC.
BD^2 = 1 * x = x.
BD = sqrt(x).
```

Requirements:

- Detect and report `x < 0` as not renderable as a real length.
- Show both semicircle and perpendicular construction.
- Treat intersection `D` as a selected branch event.
- Proof card must mention nonnegative root.

---

## 7. Milestones and Agent Tasks

## Milestone 1: Repository bootstrap and quality gates

Goal: Establish a clean TypeScript/React/SVG project with reproducible commands.

### Task 1.1: Inspect repository

Context:

- Repository may be empty or may already contain files.
- Do not overwrite existing work without checking.

Steps:

1. Clone/open repository.
2. Inspect files and package metadata.
3. If project exists, document current structure in `docs/REPO_STATE.md`.
4. If project is empty, create the initial Vite React TypeScript app.
5. Ensure README identifies the project as Geometry Computer.

Acceptance criteria:

- Repository can be installed with `npm install`.
- `README.md` exists and describes the project.
- Existing files are preserved unless intentionally migrated.

Required verification:

```bash
npm install
npm run build
```

Commit:

```bash
git add .
git commit -m "Bootstrap geometry computer project"
git push origin main
```

### Task 1.2: Add test/lint/format/typecheck tooling

Steps:

1. Add Vitest.
2. Add ESLint.
3. Add Prettier.
4. Add TypeScript type checking script.
5. Add the canonical scripts to `package.json`.
6. Add one smoke test.
7. Add basic CI workflow if appropriate.

Acceptance criteria:

- `npm test` passes.
- `npm run typecheck` passes.
- `npm run lint` passes.
- `npm run build` passes.
- `npm run format:check` passes.

Documentation:

- Update `README.md` with setup and verification commands.

Commit:

```bash
git add .
git commit -m "Add quality gates and project scripts"
git push origin main
```

---

## Milestone 2: Domain model for expressions and construction traces

Goal: Create testable non-UI models for expressions, construction nodes, geometry objects, steps, proofs, and reveal actions.

### Task 2.1: Add expression model

Files to create:

```text
src/domain/expression/types.ts
src/domain/expression/format.ts
src/domain/expression/examples.ts
src/domain/expression/types.test.ts
```

Implementation:

1. Define `Expr` union type.
2. Add helpers for constants, variables, add, sub, mul, div, pow, sqrt.
3. Add formatting to plain text and LaTeX.
4. Add example expression for `3a^2 + 4ab + b^2`.
5. Add example simplified expression `(3a + b)(a + b)`.

Tests:

- Formatting `3a^2 + 4ab + b^2` returns stable text.
- LaTeX formatting produces stable output.
- Example expressions compile without type errors.

Documentation:

- Add `docs/DOMAIN_MODEL.md` section for expression AST.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Add expression domain model"
git push origin main
```

### Task 2.2: Add construction trace model

Files to create:

```text
src/domain/construction/types.ts
src/domain/construction/examples.ts
src/domain/construction/types.test.ts
```

Implementation:

1. Define `ConstructionOpKind`.
2. Define `ConstructionNode`.
3. Define `ConstructionStep`.
4. Define `RevealAction`.
5. Define `OperationProof` and `ProofClaim`.
6. Add hardcoded construction trace for `(3a + b)(a + b)` at macro level.

Tests:

- Example trace has unique IDs.
- Every step output references known objects or construction nodes.
- Every proof ID referenced by a step exists.

Documentation:

- Extend `docs/DOMAIN_MODEL.md` with construction trace model.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Add construction trace model"
git push origin main
```

### Task 2.3: Add geometry object model

Files to create:

```text
src/domain/geometry/types.ts
src/domain/geometry/coordinates.ts
src/domain/geometry/types.test.ts
```

Implementation:

1. Define points, segments, lines, rays, circles, arcs, labels, triangles.
2. Define object roles.
3. Define provenance fields.
4. Define coordinate helpers for rendering.
5. Define tolerance utilities for numeric tests.

Tests:

- Create point, segment, line, circle objects.
- Provenance fields are required by constructors.
- Coordinate helpers produce expected values.

Documentation:

- Extend `docs/DOMAIN_MODEL.md` with geometry object model.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Add geometry object model"
git push origin main
```

---

## Milestone 3: Static SVG rendering foundation

Goal: Render geometry objects as SVG without scroll animation yet.

### Task 3.1: Create SVG renderer components

Files to create:

```text
src/render/svg/SvgConstructionCanvas.tsx
src/render/svg/renderObject.tsx
src/render/svg/objectStyles.ts
src/render/svg/SvgConstructionCanvas.test.tsx
```

Implementation:

1. Render points, segments, lines/rays, circles, arcs, labels.
2. Render based on object role.
3. Use semantic CSS classes, not hardcoded inline styling where avoidable.
4. Support viewBox and coordinate conversion.
5. Render unknown object kinds with a safe fallback or omit with warning.

Tests:

- Component renders a point with label.
- Component renders a segment.
- Component renders a circle.
- Role maps to CSS class.

Documentation:

- Add `docs/RENDERING.md` explaining SVG rendering model.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Add static SVG construction renderer"
git push origin main
```

### Task 3.2: Add example static construction scene

Files to create/update:

```text
src/domain/examples/examplePolynomialScene.ts
src/App.tsx
src/App.css
```

Implementation:

1. Create static geometry scene for inputs `a`, `b`, unit `1`, `x = 3a+b`, `y = a+b`, and result placeholder.
2. Render the scene in the app.
3. Include a side panel listing macro steps.
4. No animation yet.

Acceptance criteria:

- Browser displays a diagram and construction steps.
- SVG objects have stable IDs.
- Step list uses the same IDs as domain objects.

Documentation:

- Add screenshot instructions or dev notes to `docs/RENDERING.md`.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Render initial polynomial construction scene"
git push origin main
```

---

## Milestone 4: Scroll-driven reveal system

Goal: Make scroll position drive construction time.

### Task 4.1: Add scroll progress infrastructure

Files to create:

```text
src/ui/scroll/useScrollProgress.ts
src/ui/scroll/ScrollConstructionLayout.tsx
src/ui/scroll/ScrollStep.tsx
src/ui/scroll/useScrollProgress.test.ts
```

Implementation:

1. Create sticky SVG + scroll column layout.
2. Use scroll position to compute global progress from `0` to `1`.
3. Compute active step from scroll section visibility or progress thresholds.
4. Keep implementation simple; use browser APIs directly.
5. Respect reduced-motion preference by allowing instant state changes.

Tests:

- Progress clamps between `0` and `1`.
- Step selection chooses correct active step at thresholds.
- Reduced-motion utility returns expected values when mocked.

Documentation:

- Add `docs/SCROLL_INTERACTION.md`.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Add scroll-driven construction layout"
git push origin main
```

### Task 4.2: Implement reveal-action evaluation

Files to create:

```text
src/domain/reveal/evaluateReveal.ts
src/domain/reveal/evaluateReveal.test.ts
```

Implementation:

1. Given reveal actions and global progress, compute object visibility.
2. Compute partial draw progress for paths, circles, arcs, and segments.
3. Compute active/highlight/dim states.
4. Return a render state independent of React.

Tests:

- Object hidden before reveal start.
- Object partially visible during reveal interval.
- Object fully visible after reveal end.
- Fade-out and dim behavior are deterministic.

Documentation:

- Update `docs/SCROLL_INTERACTION.md` with reveal action semantics.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Add reveal action evaluation"
git push origin main
```

### Task 4.3: Animate SVG drawing from reveal state

Files to update:

```text
src/render/svg/SvgConstructionCanvas.tsx
src/render/svg/renderObject.tsx
src/render/svg/objectStyles.ts
src/App.tsx
```

Implementation:

1. Apply draw progress to SVG elements.
2. Use `stroke-dasharray` and `stroke-dashoffset` where practical.
3. Fade in points and labels.
4. Dim retired scaffolding.
5. Ensure full construction can still render statically when reduced motion is enabled.

Tests:

- Rendering with partial progress applies expected attributes/classes.
- Rendering with full progress shows completed objects.
- Reduced-motion mode does not produce broken invisible objects.

Documentation:

- Update `docs/RENDERING.md` with animation conventions.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Animate SVG construction reveal"
git push origin main
```

---

## Milestone 5: Bidirectional highlighting and object inspector

Goal: Make diagram, step list, and object metadata mutually inspectable.

### Task 5.1: Add interaction state model

Files to create:

```text
src/ui/interaction/interactionState.ts
src/ui/interaction/interactionState.test.ts
```

Implementation:

1. Track active step ID.
2. Track hovered object ID.
3. Track selected object ID.
4. Track hovered/selected step ID.
5. Derive highlighted object IDs from step/object provenance.
6. Derive highlighted step IDs from object provenance.

Tests:

- Hovering object highlights creating step.
- Hovering step highlights input and output objects.
- Selecting object persists inspector target.
- Clearing selection behaves correctly.

Documentation:

- Add interaction section to `docs/SCROLL_INTERACTION.md`.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Add bidirectional interaction state"
git push origin main
```

### Task 5.2: Wire hover/click behavior in UI

Files to update/create:

```text
src/render/svg/SvgConstructionCanvas.tsx
src/ui/steps/ConstructionStepList.tsx
src/ui/inspector/ObjectInspector.tsx
src/ui/inspector/ObjectInspector.test.tsx
```

Implementation:

1. Make SVG objects hoverable/clickable.
2. Make construction steps hoverable/clickable.
3. Highlight corresponding objects and steps.
4. Add object inspector panel.
5. Inspector shows object kind, label, role, created step, dependencies, represented expression, and used-by steps.

Acceptance criteria:

- Hovering a visible segment highlights the corresponding step.
- Hovering a step highlights relevant geometry.
- Clicking an object opens inspector.
- Inspector content is stable and readable.

Documentation:

- Update `docs/INTERACTION.md` or create it if needed.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Connect geometry objects to construction steps"
git push origin main
```

---

## Milestone 6: Proof cards for operations

Goal: Add hover/click proof explanations for complex operations.

### Task 6.1: Add proof-card data for arithmetic operations

Files to create:

```text
src/domain/proofs/arithmeticProofs.ts
src/domain/proofs/arithmeticProofs.test.ts
```

Implementation:

1. Add proof for addition.
2. Add proof for subtraction.
3. Add proof for multiplication.
4. Add proof for division.
5. Add proof for squaring.
6. Add proof for square root, even if square root rendering is implemented later.
7. Link proof claims to semantic object IDs or roles where possible.

Tests:

- Every proof has title, intuition, claims, and conclusion.
- Division proof includes `y ≠ 0` assumption.
- Square root proof includes `x ≥ 0` assumption.
- Multiplication proof includes similar-triangle ratio.

Documentation:

- Add `docs/PROOFS.md` with the explanatory text and invariants.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Add arithmetic operation proofs"
git push origin main
```

### Task 6.2: Build proof card component

Files to create:

```text
src/ui/proofs/ProofCard.tsx
src/ui/proofs/ProofCard.test.tsx
src/ui/proofs/ProofClaim.tsx
```

Implementation:

1. Render operation proof title.
2. Render intuition.
3. Render givens.
4. Render claims.
5. Render conclusion.
6. Render assumptions.
7. Hovering a proof claim should request highlight of linked geometry.
8. Support click/tap expansion for mobile.

Acceptance criteria:

- Proof card appears for multiplication step.
- Hovering a proof claim highlights corresponding diagram objects.
- Proof card works without hover through click/tap.

Documentation:

- Update `docs/PROOFS.md` with UI behavior.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Add interactive proof cards"
git push origin main
```

---

## Milestone 7: Macro construction generators

Goal: Generate construction traces and geometry from operation macros instead of hand-authoring every object.

### Task 7.1: Add construction context and ID allocator

Files to create:

```text
src/domain/construction/ConstructionContext.ts
src/domain/construction/idAllocator.ts
src/domain/construction/ConstructionContext.test.ts
```

Implementation:

1. Maintain map of symbolic values to geometry objects.
2. Maintain list of created objects.
3. Maintain list of steps.
4. Maintain reveal actions.
5. Provide deterministic ID allocation.
6. Provide methods to register objects, steps, and proofs.

Tests:

- IDs are deterministic.
- Registering object stores provenance.
- Looking up a missing object returns controlled error.

Documentation:

- Update `docs/DOMAIN_MODEL.md`.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Add construction generation context"
git push origin main
```

### Task 7.2: Implement addition and subtraction macros

Files to create:

```text
src/domain/construction/macros/addition.ts
src/domain/construction/macros/subtraction.ts
src/domain/construction/macros/arithmeticMacros.test.ts
```

Implementation:

1. Given input value IDs, generate geometry objects for addition.
2. Generate macro step and primitive substeps.
3. Generate reveal actions.
4. Generate provenance links.
5. Generate proof references.
6. Repeat for subtraction.

Tests:

- Addition macro output numeric value equals sum.
- Subtraction macro output numeric value equals difference.
- Negative subtraction result is represented as directed length.
- Steps and objects have unique IDs.

Documentation:

- Update `docs/CONSTRUCTION_MACROS.md`.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Generate addition and subtraction constructions"
git push origin main
```

### Task 7.3: Implement multiplication macro

Files to create/update:

```text
src/domain/construction/macros/multiplication.ts
src/domain/construction/macros/arithmeticMacros.test.ts
```

Implementation:

1. Place `O`, `U`, `X`, and `Y` according to canonical template.
2. Create auxiliary ray.
3. Create line `UY`.
4. Create parallel through `X`.
5. Create intersection point `Z`.
6. Create result extraction segment.
7. Add proof references and reveal actions.
8. Add branch/intersection metadata.

Tests:

- Numeric result equals product.
- Similar-triangle objects are created.
- Intersection event exists.
- Result extraction step exists.
- Proof card references valid objects.

Documentation:

- Update `docs/CONSTRUCTION_MACROS.md` with multiplication construction and proof invariant.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Generate multiplication construction"
git push origin main
```

### Task 7.4: Implement division macro

Files to create/update:

```text
src/domain/construction/macros/division.ts
src/domain/construction/macros/arithmeticMacros.test.ts
```

Implementation:

1. Use canonical similar-triangle division layout.
2. Detect division by zero before rendering.
3. Represent invalid construction as a domain error, not as broken geometry.
4. Add proof references and reveal actions.

Tests:

- Numeric result equals quotient.
- Division by zero returns expected error.
- Assumption `denominator != 0` appears in step/proof metadata.

Documentation:

- Update `docs/CONSTRUCTION_MACROS.md` with division construction and assumptions.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Generate division construction"
git push origin main
```

### Task 7.5: Implement squaring macro

Files to create/update:

```text
src/domain/construction/macros/square.ts
src/domain/construction/macros/arithmeticMacros.test.ts
```

Implementation:

1. Reuse multiplication machinery with same input twice.
2. Preserve operation kind as `square`.
3. Use square-specific proof card.
4. Display square-specific operation badge.

Tests:

- Numeric result equals square.
- Operation kind remains `square`.
- Proof is square proof, not generic multiplication proof.

Documentation:

- Update `docs/CONSTRUCTION_MACROS.md`.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Generate squaring construction"
git push origin main
```

### Task 7.6: Implement square-root macro

Files to create/update:

```text
src/domain/construction/macros/squareRoot.ts
src/domain/construction/macros/arithmeticMacros.test.ts
```

Implementation:

1. Place consecutive segments `1` and `x` on a baseline.
2. Draw semicircle with diameter `1 + x`.
3. Construct perpendicular at the join point.
4. Create intersection with semicircle.
5. Select positive/nonnegative root branch.
6. Extract result segment.
7. Detect negative input before rendering.

Tests:

- Numeric result equals square root.
- Negative input returns expected error.
- Semicircle, perpendicular, and intersection event exist.
- Proof references valid geometry.

Documentation:

- Update `docs/CONSTRUCTION_MACROS.md` with square-root construction.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Generate square-root construction"
git push origin main
```

---

## Milestone 8: Expression compiler

Goal: Compile expression ASTs into construction traces using macro generators.

### Task 8.1: Add expression normalization and simplification hooks

Files to create:

```text
src/domain/expression/normalize.ts
src/domain/expression/simplify.ts
src/domain/expression/simplify.test.ts
```

Implementation:

1. Normalize `pow(x, 2)` to square operation where appropriate.
2. Flatten associative additions/multiplications if helpful.
3. Fold numeric constants where simple.
4. Preserve original expression for display.
5. Allow a manual simplified expression override for examples.

Tests:

- `pow(x, 2)` normalizes to square candidate.
- Simple constants fold.
- Original expression remains available.

Documentation:

- Add `docs/EXPRESSION_COMPILER.md`.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Add expression normalization hooks"
git push origin main
```

### Task 8.2: Compile AST recursively to construction trace

Files to create:

```text
src/domain/compiler/compileExpression.ts
src/domain/compiler/compileExpression.test.ts
```

Implementation:

1. Given expression AST and sample variable values, produce construction scene.
2. Compile variables as given lengths.
3. Compile constants as constructible unit multiples where practical.
4. Compile add/sub/mul/div/square/sqrt using macro generators.
5. Reuse repeated subexpressions when possible.
6. Return domain errors for invalid operations.

Tests:

- Compile `a + b`.
- Compile `a - b`.
- Compile `a * b`.
- Compile `a / b`.
- Compile `a^2`.
- Compile `sqrt(a)`.
- Compile `(3a + b)(a + b)`.
- Final numeric result matches evaluation.

Documentation:

- Update `docs/EXPRESSION_COMPILER.md` with examples.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Compile expressions to construction traces"
git push origin main
```

### Task 8.3: Replace hardcoded scene with compiled example

Files to update:

```text
src/App.tsx
src/domain/examples/examplePolynomialScene.ts
```

Implementation:

1. Use compiler to produce example construction.
2. Keep example expression and sample values in one place.
3. Display original and simplified expression.
4. Display construction trace generated from compiler.

Acceptance criteria:

- App still renders the polynomial example.
- Steps and SVG objects come from compiler output.
- Tests pass.

Documentation:

- Update README with description of the default example.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Use compiler for default construction example"
git push origin main
```

---

## Milestone 9: Expression tree and operation badges

Goal: Improve organizational intelligibility.

### Task 9.1: Add expression tree panel

Files to create:

```text
src/ui/expression/ExpressionTree.tsx
src/ui/expression/ExpressionTree.test.tsx
```

Implementation:

1. Render expression DAG/tree.
2. Show original expression and simplified/compiled expression.
3. Highlight active node from active construction step.
4. Clicking a node highlights corresponding construction steps and geometry.

Acceptance criteria:

- Tree displays `(3a+b)(a+b)` as root with children.
- Active construction step highlights matching tree node.
- Tree node click highlights related geometry.

Documentation:

- Update `docs/INTERACTION.md` with expression tree behavior.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Add synchronized expression tree"
git push origin main
```

### Task 9.2: Add operation badges

Files to create:

```text
src/ui/steps/OperationBadge.tsx
src/ui/steps/OperationBadge.test.tsx
```

Implementation:

1. Show operation kind.
2. Show inputs.
3. Show output.
4. Show method, e.g. `similar-triangle scaling`.
5. Link badge to proof card when present.

Acceptance criteria:

- Multiplication step shows operation, inputs, output, and method.
- Square root step, when present, shows geometric-mean method.
- Badge is readable in narrow layout.

Documentation:

- Update `docs/INTERACTION.md`.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Add operation badges to construction steps"
git push origin main
```

---

## Milestone 10: Input parsing and example gallery

Goal: Let users explore examples without requiring code changes.

### Task 10.1: Add minimal expression parser

Files to create:

```text
src/domain/parser/parseExpression.ts
src/domain/parser/parseExpression.test.ts
```

Implementation:

Support:

- variables: `a`, `b`, `x`, `y`
- numbers: integers and decimals
- operators: `+`, `-`, `*`, `/`, `^`
- parentheses
- `sqrt(...)`

Do not support implicit multiplication initially unless easy and well-tested. It is acceptable to require `3*a^2 + 4*a*b + b^2`.

Tests:

- Parse `a+b`.
- Parse `a-b`.
- Parse `a*b`.
- Parse `a/b`.
- Parse `a^2`.
- Parse `sqrt(a)`.
- Parse `3*a^2 + 4*a*b + b^2`.
- Reject malformed expressions with readable errors.

Documentation:

- Update README with accepted syntax.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Add minimal expression parser"
git push origin main
```

### Task 10.2: Add expression input UI

Files to create/update:

```text
src/ui/input/ExpressionInput.tsx
src/ui/input/ExpressionInput.test.tsx
src/App.tsx
```

Implementation:

1. Add expression text field.
2. Add sample values for variables.
3. Add compile/render button.
4. Show parser/compiler errors clearly.
5. Keep default polynomial example loaded.

Acceptance criteria:

- User can enter `a+b` and render construction.
- User can enter `a*b` and render construction.
- Invalid input shows readable error without crashing.

Documentation:

- Update README with input usage.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Add expression input UI"
git push origin main
```

### Task 10.3: Add example gallery

Files to create:

```text
src/domain/examples/gallery.ts
src/ui/examples/ExampleGallery.tsx
src/ui/examples/ExampleGallery.test.tsx
```

Examples:

- `a + b`
- `a - b`
- `a * b`
- `a / b`
- `a^2`
- `sqrt(a)`
- `(3*a + b) * (a + b)`
- `3*a^2 + 4*a*b + b^2` with simplification note

Acceptance criteria:

- Clicking an example loads expression and sample values.
- Gallery examples compile successfully.
- Documentation explains what each example demonstrates.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Add construction example gallery"
git push origin main
```

---

## Milestone 11: Rendering polish and accessibility

Goal: Make the construction readable, pleasant, and accessible.

### Task 11.1: Improve visual hierarchy

Implementation:

1. Define CSS variables for roles.
2. Distinguish inputs, unit, active construction, scaffold, intermediate, and result.
3. Make labels legible.
4. Add focus outlines for keyboard navigation.
5. Ensure final result is visually strongest.

Acceptance criteria:

- Viewer can visually distinguish result vs scaffolding.
- Labels do not dominate the diagram.
- Active step is obvious.

Documentation:

- Update `docs/RENDERING.md` with visual grammar.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Polish construction visual hierarchy"
git push origin main
```

### Task 11.2: Add scaffolding visibility controls

Controls:

- Show all scaffolding.
- Show current-step scaffolding.
- Hide retired scaffolding.

Acceptance criteria:

- Control updates SVG without recompiling expression.
- Current-step mode keeps active construction understandable.
- Final frame can show clean result.

Documentation:

- Update README or `docs/INTERACTION.md`.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Add scaffolding visibility controls"
git push origin main
```

### Task 11.3: Add keyboard and reduced-motion accessibility

Implementation:

1. Keyboard navigation between steps.
2. Keyboard selection of objects where practical.
3. Respect `prefers-reduced-motion`.
4. Ensure proof cards can be opened without hover.
5. Add ARIA labels for interactive controls.

Acceptance criteria:

- User can navigate steps with keyboard.
- Reduced-motion mode avoids scroll animation dependence.
- Proof cards work with click/tap/keyboard.

Documentation:

- Add `docs/ACCESSIBILITY.md`.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Improve accessibility and reduced-motion support"
git push origin main
```

---

## Milestone 12: Export and documentation

Goal: Make outputs reusable and project understandable.

### Task 12.1: Export construction as JSON

Implementation:

1. Add button to export construction trace as JSON.
2. Include expression, sample values, construction steps, geometry objects, reveal actions, and proofs.
3. Avoid including volatile UI state.

Tests:

- Exported JSON validates against expected shape.
- Importing/reusing exported JSON in a test can render scene.

Documentation:

- Add `docs/EXPORT_FORMAT.md`.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Add construction JSON export"
git push origin main
```

### Task 12.2: Export final SVG

Implementation:

1. Add button to export current SVG.
2. Include necessary styles inline or as embedded style element.
3. Support export of current scroll state and clean final state.

Acceptance criteria:

- Exported SVG opens in a browser.
- Clean final SVG contains result label and expression summary.

Documentation:

- Update `docs/EXPORT_FORMAT.md`.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Add SVG export"
git push origin main
```

### Task 12.3: Write user-facing documentation

Files to update/create:

```text
README.md
docs/GETTING_STARTED.md
docs/MATH_BACKGROUND.md
docs/ARCHITECTURE.md
```

Documentation must explain:

- What the app does.
- What constructible field operations are supported.
- Why unit length matters.
- Difference between symbolic construction and numeric rendering.
- How scroll-driven construction works.
- How proof cards work.
- How to run tests/build.
- How to add a new construction macro.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Document geometry computer architecture and usage"
git push origin main
```

---

## 8. Suggested Directory Structure

Target structure after the first several milestones:

```text
geometry-computer/
  README.md
  ROADMAP.md
  package.json
  tsconfig.json
  vite.config.ts
  src/
    App.tsx
    App.css
    main.tsx
    domain/
      compiler/
        compileExpression.ts
      construction/
        ConstructionContext.ts
        idAllocator.ts
        types.ts
        examples.ts
        macros/
          addition.ts
          subtraction.ts
          multiplication.ts
          division.ts
          square.ts
          squareRoot.ts
      expression/
        examples.ts
        format.ts
        normalize.ts
        simplify.ts
        types.ts
      geometry/
        coordinates.ts
        intersections.ts
        types.ts
      parser/
        parseExpression.ts
      proofs/
        arithmeticProofs.ts
      reveal/
        evaluateReveal.ts
    render/
      svg/
        SvgConstructionCanvas.tsx
        objectStyles.ts
        renderObject.tsx
    ui/
      examples/
        ExampleGallery.tsx
      expression/
        ExpressionTree.tsx
      input/
        ExpressionInput.tsx
      inspector/
        ObjectInspector.tsx
      interaction/
        interactionState.ts
      proofs/
        ProofCard.tsx
        ProofClaim.tsx
      scroll/
        ScrollConstructionLayout.tsx
        ScrollStep.tsx
        useScrollProgress.ts
      steps/
        ConstructionStepList.tsx
        OperationBadge.tsx
  docs/
    ACCESSIBILITY.md
    ARCHITECTURE.md
    CONSTRUCTION_MACROS.md
    DOMAIN_MODEL.md
    EXPORT_FORMAT.md
    EXPRESSION_COMPILER.md
    GETTING_STARTED.md
    INTERACTION.md
    MATH_BACKGROUND.md
    PROOFS.md
    RENDERING.md
    SCROLL_INTERACTION.md
```

---

## 9. Testing Strategy

### Unit tests

Prioritize pure logic:

- Expression formatting.
- Expression parsing.
- Expression normalization.
- Numeric evaluation.
- Construction macro generation.
- Geometry coordinate helpers.
- Intersection calculations.
- Reveal action evaluation.
- Interaction-state derivation.

### Component tests

Use component tests for:

- SVG renderer output.
- Step list highlighting.
- Object inspector.
- Proof card behavior.
- Expression input errors.

### End-to-end tests, later

Use Playwright for:

- Load default example.
- Scroll construction.
- Hover/click object.
- Open proof card.
- Change expression.
- Export SVG/JSON.

### Mathematical tests

For every construction macro:

- Test nominal positive inputs.
- Test zero where meaningful.
- Test negative output for subtraction.
- Test invalid denominator for division.
- Test invalid square root input.
- Test that output numeric value matches arithmetic evaluation.
- Test that every object has provenance.
- Test that every proof highlight references an existing object.

---

## 10. Mathematical Assumptions to Document

The app should explicitly document these assumptions:

1. A fixed unit segment `1` is given.
2. Multiplication of lengths is interpreted relative to the unit segment.
3. Numeric rendering uses sample values and is illustrative.
4. The construction trace is the mathematical object; the SVG is a visualization of one instance.
5. Directed lengths are allowed on the number line.
6. Division requires nonzero denominator.
7. Square root requires nonnegative radicand for real straightedge-compass length output.
8. Intersections may have multiple branches; branch choices must be represented explicitly.
9. The MVP supports field operations, plus optional square roots, not arbitrary functions.

---

## 11. Definition of Done

A task is done only when:

- Feature works in the browser if UI-facing.
- Relevant tests are added or updated.
- All test/typecheck/lint/build/format checks pass.
- Documentation is updated.
- Code is committed with a clear message.
- Commit is pushed to `main`.

A construction macro is done only when:

- It has numeric tests.
- It has geometry objects with provenance.
- It has construction steps.
- It has reveal actions.
- It has proof-card data or an explicit reason no proof is needed.
- It handles invalid/degenerate inputs explicitly.
- It renders in the app.

A UI interaction is done only when:

- It works with mouse.
- It has a click/tap equivalent if hover is involved.
- It is keyboard-accessible where practical.
- It respects reduced-motion if animation is involved.
- It has component or logic tests.

---

## 12. Recommended First Agent Prompt

Use this prompt in Codex after the repository is available:

```text
You are working in https://github.com/dnrohr/geometry-computer.

Read ROADMAP.md completely. Start with Milestone 1 only. Inspect the repository before making changes. If it is empty, bootstrap a Vite React TypeScript app. Add test, lint, format, typecheck, and build scripts. Add a README with setup instructions and a short project description. Add one smoke test. Run npm install, npm test, npm run typecheck, npm run lint, npm run build, and npm run format:check. Fix any failures. Commit the completed milestone with a clear message and push to main.

Do not begin Milestone 2 until Milestone 1 is committed and pushed.
```

---

## 13. Recommended Second Agent Prompt

After Milestone 1 is complete:

```text
Continue in https://github.com/dnrohr/geometry-computer.

Read ROADMAP.md and implement Milestone 2 only: expression model, construction trace model, and geometry object model. Keep all domain logic independent from React. Add tests and documentation exactly as requested in the roadmap. Run npm test, npm run typecheck, npm run lint, npm run build, and npm run format:check. Fix failures. Commit with a clear message and push to main.

Do not begin Milestone 3 until Milestone 2 is committed and pushed.
```

---

## 14. Future Ideas After MVP

Only consider these after the MVP is working and documented.

- More sophisticated algebraic simplification.
- Common-subexpression elimination.
- Import/export construction scripts.
- Formal construction verification.
- GeoGebra export.
- Better mobile layout.
- Timeline scrubber with play/pause.
- User-authored construction macros.
- Support for nested radicals.
- Support for exact symbolic coordinates.
- Animated branch-choice explanations.
- Side-by-side algebraic and geometric proof modes.
- Educational lesson mode.
