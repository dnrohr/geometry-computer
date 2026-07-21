# Origami Domain Model

The flat-origami track uses its own scene model under `src/domain/origami`.
These types intentionally do not import or extend the existing
compass-and-straightedge construction trace. The only planned early shared
boundary is expression parsing, introduced later by the origami compiler.

## Scene Shape

An `OrigamiFoldScene` contains:

- `objects`: paper boundary, points, lines, creases, segments, reflected points,
  and labels.
- `steps`: fold operations with input objects, created objects, output objects,
  the selected fold solution, and optional degeneracy notes.
- `proofs`: origami-specific proof records for fold axioms and later arithmetic
  macros.

All IDs are stable strings in fixtures and generated scenes. Objects carry
provenance through `sourceObjectIds`, optional expression metadata, optional
macro metadata, and the fold step that produced them.

## Folds and Branches

Fold steps name a Huzita-Hatori-style axiom such as `point-to-point`,
`point-to-line`, or `line-to-line`. A step may produce more than one geometric
solution, so the chosen branch is recorded as `selectedSolutionId`.

Mountain/valley assignment is represented on crease objects as optional
computation metadata. Early arithmetic traces can operate on flat crease
geometry without committing to a physical folding sequence.

The first fold axiom templates are deterministic:

- `point-to-point` returns the perpendicular-bisector crease and rejects
  coincident points.
- `point-to-line` uses the perpendicular projection of the point onto the target
  line as the selected image point; a point already on the line is treated as an
  ambiguous family of folds.
- `line-to-line` returns sorted angle-bisector solutions for intersecting lines,
  the midline solution for distinct parallel lines, and an ambiguous-fold error
  for coincident lines.

These branch choices are intentionally simple so early arithmetic examples can
be tested without a general fold solver.

## Arithmetic Compiler Trace

`compileOrigamiExpression` is a separate compiler entry point under
`src/domain/origami/compiler`. It accepts the shared parsed expression AST, then
emits origami-only scene objects and arithmetic macro steps. It does not import
the compass-and-straightedge compiler.

## Allowable Function Field

The fold-animation function track defines its first validation boundary in
`src/domain/origami/function/allowableField.ts`. It accepts parsed expression
ASTs made from variables, finite rational or decimal constants, addition,
subtraction, multiplication, division, nonnegative integer powers supported by
the parser, square roots, and composition of those expressions.

Validation is sampled because the early origami tab computes concrete fold
traces for chosen input lengths. A function is outside the sampled real-valued
origami domain when a variable value is missing or nonfinite, a denominator
evaluates to zero, a square-root radicand evaluates negative, or a power is not
a nonnegative integer. These failures return origami-specific diagnostics so
later UI work can block animation without touching the existing
compass-and-straightedge compiler or error surface.

`src/domain/origami/function/parserBoundary.ts` is the explicit shared-parser
boundary for the origami function lab. Origami production modules should import
`parseOrigamiExpression` instead of importing `parseExpression` directly.
`src/domain/origami/function/functionInput.ts` owns the tab-facing input state
and returns origami-specific panel states for valid, blocked, and parse-error
inputs. Planning, animation state, paper style, and function-animation export
contracts live in `src/domain/origami/function/types.ts`; they are intentionally
separate from the current compass-and-straightedge construction, rendering,
proof, and export types. `src/domain/origami/function/variableControls.ts` owns
the sampled variable-control range, step, default, and clamp metadata used by the
tab UI. `parserBoundary.test.ts` scans production origami files so this
separation fails loudly if a later change reaches around the boundary.

`src/domain/origami/function/functionPreview.ts` provides the first F0 regression
target for function compilation and animation state. It compiles a valid
origami function input into a deterministic local preview plan with phases for
placing paper, marking sampled inputs, and extracting the result. The preview is
deliberately simple until F2/F3 add richer fold phases, but it already uses the
origami-owned plan, animation, and paper-style contracts so tab-switching tests
can prove this state stays separate from the compass-and-straightedge workspace.

`src/domain/origami/function/functionPlan.ts` is the F2.1 plan builder. It walks
the parsed expression into stable plan nodes with sampled intermediate values,
dependency links, operation records, reusable length-transfer diagnostics for
repeated subexpressions, and result-extraction metadata. The preview compiler now
uses this model while still rendering the same early deterministic phases.
Plan nodes also carry an explicit topological `order` and dependency depth.
`executionOrder` and `dependencyJumpTargets` make F2.2 animation navigation
deterministic: later timeline work can play from inputs to result or jump to the
node that produced any dependency without re-walking the expression tree.
F2.3 expands each arithmetic node into animation-ready phases for alignment,
crease preview, folding, transfer/reflection, and intersection marking. Inputs
and constants still get compact mark phases, and the final node receives a
separate result-extraction phase.
F2.4 adds fold-motion metadata to those arithmetic phases: fold direction, a
stable hinge line, moving and stationary paper regions, front/back side exposure,
and the selected branch/reason. These records are deterministic animation
contracts for the separate function tab; they are intentionally simple until a
later physical fold solver can replace the placeholder geometry.
F2.5 labels unsolved arithmetic macro phases with `physicalStatus:
explanatory-fallback` plus fallback details. Setup phases such as placing paper
and marking inputs are marked `proven-physical`; arithmetic fold playback and
result extraction remain clear explanatory traces until the solver can prove an
actual fold sequence.
F2.6 adds plan diagnostics for nonfatal animation concerns: reused
subexpressions, repeated variables, negative directed lengths, branch ambiguity,
and accumulated scale. These diagnostics do not replace sampled-domain
validation; they explain what the animation planner needs to make visible once a
function is already allowable.
F5.1 adds a solver-readiness report to each function plan. The report is derived
from the phase `physicalStatus` fields, counts proven versus fallback phases,
lists fallback phase IDs, and tells the UI/export layer whether the current
function animation is physically ready or still waiting on fold-solver support.
F5.2 adds fold certificates for phases that are already physically proven:
paper placement, direct length marking, and identity result extraction. The
readiness report now also counts certified phases so future solver work can
replace fallback phases with explicit proof artifacts one step at a time.

`src/domain/origami/function/functionExamples.ts` owns the first F1 function
presets. Each preset has a signature-style display source, an expression body,
and sampled values for the function lab. The parser boundary accepts either a
bare expression or a signature such as `f(a,b)=a*b`, verifies that signature
variables match the expression variables, and normalizes display labels such as
`f(a, b) = a * b`.

The supported O3 trace covers variables, constants, addition, subtraction,
multiplication, division, square, and square root on deterministic baselines.
Each macro records sampled numeric output, expression provenance, input segment
IDs, an output segment, and a crease marker representing the fold trace used by
later rendering work.

When a formatted subexpression is reused, the compiler emits a `copy-length`
trace rather than silently reusing the same rendered segment. This keeps length
transfer visible in examples such as `a+a` and `a^2`.

Multiplication and division are modeled as intercept-style fold traces. Square
is a named specialization of multiplication, and square root is modeled as a
geometric-mean fold trace. The O3 compiler establishes deterministic scene data;
O4 turns that data into an interactive crease-pattern explanation.

Each arithmetic fold step can now carry a `macroTrace` contract. This contract is
the expansion point for the richer N1 geometry and records:

- source segments used by the macro.
- unit-reference objects used to normalize products, quotients, and geometric
  means.
- guide lines, fold creases, reflected objects, and selected intersections.
- result segments produced by the macro.
- proof claim IDs that justify the construction.
- branch selections, including the selected branch and the reason for choosing
  it.
- degeneracy-related object IDs once a valid scene needs to show why a branch
  failed or became ambiguous.

Simple arithmetic macros fill this contract with the deterministic baseline
trace: source segment IDs, one crease marker, one result segment, a proof claim
ID, and a selected baseline-transfer branch. Advanced N1 macros fill the unit,
guide, crease, selected-intersection, and result slots with inspectable
intermediate geometry without changing the compass-and-straightedge compiler or
renderer.

The advanced macro contracts are:

- `mul`: source segments are the two factors; the unit reference is the
  normalized baseline segment; guide lines are the ratio guide and parallel
  scale guide; fold creases include the baseline transfer, ratio guide crease,
  and product projection crease; the selected intersection is the scaled product
  point; the branch is `mul-intercept-similar-triangle`.
- `div`: source segments are numerator and denominator; the unit reference is
  the reciprocal unit segment; guide lines are reciprocal and quotient guides;
  fold creases include the baseline transfer, reciprocal guide crease, and
  quotient projection crease; selected intersections are reciprocal and quotient
  points; the branch is `div-reciprocal-intercept`.
- `square`: source segments are the original input and the visible copied
  length; the remaining contract slots reuse the multiplication geometry; the
  branch is `square-multiplication-specialization`.
- `sqrt`: source segment is the radicand; the unit reference is the unit portion
  of the unit-plus-input baseline; guide lines are the baseline and
  geometric-mean guide; fold creases include the baseline transfer, midpoint
  crease, and perpendicular extraction crease; the selected intersection is the
  positive square-root point; the branch is `sqrt-geometric-mean`.

The square-root macro uses this contract to represent the geometric-mean
construction without adding circle objects yet. It records the unit-plus-input
baseline, midpoint, fold-equivalent guide lines, positive selected intersection,
and extraction creases as typed scene objects. The proof assumptions carry the
nonnegative-radicand requirement that makes the selected branch real-valued.

`compiledAdvancedOrigamiArithmeticFixtures` provides focused fixture scenes for
multiplication, division, square, and square root. These fixtures are the stable
renderer and inspector target for N1 work: each exposes unit references, guide
lines, crease objects, selected intersections, result segments, branch metadata,
and proof claim references through `macroTrace`.

Cubic roots and angle trisection are research spikes. They require the more
advanced tangent/parabola family of folds and should not be treated as acceptance
criteria for the basic arithmetic compiler.

## Degeneracy Handling

Degeneracy notes are first-class data rather than comments. Supported categories
include coincident points, parallel lines, ambiguous solutions, no-solution
cases, and folds that leave the modeled paper boundary.

The validator rejects structurally invalid scenes, including duplicate IDs,
missing references, non-finite coordinates, and zero direction vectors. Valid
degenerate mathematical cases should be represented with `degeneracies` on the
fold step once the relevant axiom template supports them.

## Isolation Rule

Compass-and-straightedge compiler, construction macro, SVG renderer, proof card,
export, and example modules must not import from `src/domain/origami` during the
separate-track phase. Shared abstractions should wait until both systems have
implemented and tested the same arithmetic family.
