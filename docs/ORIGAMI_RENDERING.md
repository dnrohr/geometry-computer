# Origami Rendering

The origami renderer lives under `src/render/origami/svg` and is intentionally
separate from the compass-and-straightedge SVG renderer.

## Canvas

`SvgOrigamiCanvas` renders `OrigamiFoldScene` objects as SVG:

- `paper-boundary`: the modeled paper area.
- `point` and `reflected-point`: marked source or reflected locations.
- `segment`: sampled length traces.
- `crease`: fold trace markers.
- `label`: expression and construction annotations.

The canvas accepts origami reveal states, highlighted object IDs, and selection
callbacks. It exposes object-level keyboard and pointer activation so the app can
drive an inspector without sharing construction-workspace state.

`SvgOrigamiCanvas` renders base scene objects first, then renders the active-fold
overlay layer. The base objects keep stable IDs of the form `origami-{objectId}`;
overlay objects use `origami-overlay-{objectId}` so export and test code can
distinguish authored geometry from the explanation highlight pass.

## Visual Roles

`buildOrigamiVisualRoleMap` assigns explanation-facing visual roles without
changing the origami scene data model. `SvgOrigamiCanvas` renders those roles as
stable CSS classes prefixed with `origami-visual-`.

The current visual roles are:

- `source-geometry`: input/source objects used by the active fold or macro.
- `guide`: unit references and guide lines used to set up a construction.
- `active-crease`: creases belonging to the selected fold step.
- `mountain-valley-candidate`: unassigned creases that may later receive a
  mountain or valley assignment.
- `reflected-geometry`: reflected points or reflected objects produced by a
  fold.
- `selected-intersection`: the chosen point or intersection used by the active
  construction branch.
- `extracted-result`: result segments produced by a macro or final expression.
- `hidden-future`: objects hidden by the current reveal state.
- `degeneracy-warning`: objects attached to a degeneracy or rejected branch.

These classes are deliberately layered over semantic object roles such as
`input`, `intermediate`, `crease`, and `result`. Later overlay work can use the
same visual-role map to highlight an active fold without changing compiler
output.

The visual-role map is derived from three inputs:

- the `OrigamiFoldScene`, including `macroTrace` source, guide, crease,
  intersection, result, branch, and degeneracy references.
- the active step ID selected from the step list or by keyboard traversal.
- reveal-state output, especially `future`, which marks quiet preview geometry.

## Active-Fold Overlays

`SvgOrigamiCanvas` renders a noninteractive `origami-active-fold-overlays` layer
after the base objects. Objects with active explanation roles are repeated in
that layer with `origami-overlay-*` IDs and the `origami-active-fold-overlay`
class. The overlay currently includes source geometry, active creases, reflected
geometry, selected intersections, and extracted result segments for the selected
step.

The base objects keep pointer and keyboard selection. Overlay objects are marked
`aria-hidden` through their parent layer and do not receive interaction props.

## Reveal States

`evaluateOrigamiReveal` maps `OrigamiRevealAction` records into per-object
visibility, draw progress, opacity, highlight, and dim state. Compiler-generated
actions are normalized over the ordered origami steps, so choosing a step can
also drive the reveal slider.

For arithmetic macro steps, source segments and guide objects are introduced at
the beginning of the step window. Active creases, selected intersections, and
result segments draw later in the same window. Objects that belong to the active
step but have not reached their reveal point are kept visible as quiet future
geometry with the `hidden-future` visual role rather than disappearing entirely.

## Interaction

The flat-origami tab provides:

- An origami-only function lab panel with an expression input, sampled
  allowable-field validation, variable discovery, per-variable slider/number
  controls for sampled values, and a sampled-result readout.
- Function example presets for product, shifted square-root, and offset quotient
  forms. The buttons populate signature-style examples such as `f(a,b)=a*b`,
  reset the matching sample controls, and show normalized names such as
  `f(a, b) = a * b`.
- Copy controls for the normalized result label and sampled result string, scoped
  to the origami function lab.
- Origami-local function compile and fold-animation preview controls that create
  deterministic preview phases before the full fold animation engine exists.
  Invalid sampled domains disable new compilation and preview advancement while
  keeping the last valid plan visible.
- A separate `SvgOrigamiFunctionAnimation` renderer for function plans. It uses
  SVG paper regions and CSS transforms for the early F3.1 fold preview while the
  existing crease-pattern trace remains available below it.
  The F3.2 renderer separates stationary paper, moving panel, front fill, back
  fill, hinge shadow, active hinge, and crease-preview layers so two-sided paper
  styling and fold motion can evolve independently.
- F3.3 timeline controls sit with the function animation and remain origami-local:
  previous phase, play/pause, next phase, scrubber, speed, and reduced-motion
  fallback. Reduced motion stops play mode and keeps phase-by-phase scrubbing
  available.
- F3.4 adds a computation readout inside the animation SVG with the current
  phase expression, sampled intermediate value when the active phase maps to a
  plan node, and final sampled result.
- F3.5 keeps the static crease-pattern inspector below the animation and adds a
  comparison link from the animation panel to the static trace region.
- F3.6 makes the function timeline itself focusable. With focus on the timeline,
  `ArrowLeft` and `ArrowRight` step phases and Space toggles play/pause; the
  existing static step buttons and SVG object selections remain independently
  keyboard reachable below the animation.
- F3.7 extends browser smoke with desktop and mobile visual-contract checks for
  the function animation: nonblank SVG, paper regions inside the viewport,
  required front/back/moving/crease layers, unclipped controls, and nonoverlapping
  timeline controls. Screenshots are saved under `.artifacts/browser-smoke/`.
- F4.1 adds the first paper-style controls beside the function animation:
  front/back colors, front/back pattern selectors, crease/highlight colors, and
  opacity. These controls update the origami function animation without touching
  the compass-and-straightedge workspace.
- F4.2 provides pattern presets for solid, grid, dots, diagonal stripe, washi
  wave, coordinate grid, and high contrast. The animation renderer applies
  separate front/back pattern overlays.
- F4.3 makes side exposure clearer in the fold animation with side-tagged front
  and back fills, separate front/back edge outlines, a moving-panel shadow, and
  a hinge highlight/shadow pair.
- F4.4 adds origami-local pattern scale and rotation sliders. The animation
  applies them through SVG pattern transforms so grid, stripe, dot, wave,
  coordinate, and high-contrast presets can be tuned for the current fold size.
- F4.5 exports the function animation as origami-local JSON with plan,
  animation, and paper-style state while smoke tests verify compass SVG exports
  do not include origami animation state.
- F4.6 adds readability guards: crease preview and active crease marks render
  with dark underlay strokes, and browser smoke checks readout contrast for the
  animation value strip.
- F5.1 surfaces function-plan solver readiness in the origami tab. The function
  lab shows ready versus fallback phase counts so arithmetic playback remains
  honest about which steps still need a physical fold solver.
- F5.2 includes certified-phase counts in that readout. Proven setup phases now
  carry fold certificates that are exported with the function animation plan.
- F5.3 shows the next solver work item in the function lab, and the animation
  JSON export includes the full fallback work-item list.
- F5.4 reduces fallback work by certifying baseline addition/subtraction phases;
  the solver readout updates as these arithmetic macros become physically
  backed.
- F5.5 renders a solver work backlog below the animation controls. Each item
  jumps the function animation directly to the fallback phase it represents.
- F5.6 marks the active backlog item and shows its branch and solver detail when
  the animation is paused on a fallback phase.
- F5.7 shows active fold-certificate details for certified phases, so proven
  paper placement, length marking, baseline arithmetic, and identity extraction
  steps are inspectable in the function lab.
- An origami example selector with one example for each supported arithmetic
  family.
- A reveal slider for fold traces.
- An SVG crease-pattern view.
- An origami step list with active-step selection and `Alt + ArrowUp` /
  `Alt + ArrowDown` traversal.
- An origami object inspector.
- Origami-specific proof cards for implemented arithmetic macro steps.
- JSON and SVG export buttons for the current origami trace.

The step list shows compact metadata for each fold: macro family, fold axiom or
macro-trace fallback, selected branch, proof-link status, and degeneracy count.
These fields stay outside the step activation button so the button label remains
focused on the step title and summary.

Proof-card claims are interactive in the origami tab. Selecting or hovering a
claim adds its `highlightObjectIds` to the canvas highlight set. Selecting a
scene object searches proof claims for that object, opens the matching proof,
selects the claim, and activates the step that owns the proof.

The object inspector shows the selected object's ID, kind, semantic role,
expression provenance, proof assumptions, selected branch or fold solution,
rejected branch labels when present, sampled numeric/display value, source
object provenance, and export IDs for the object and producing step.

The interaction state is intentionally local to the origami tab:

- `activeStepId` drives step list styling, reveal progress, visual roles, and
  overlay membership.
- `selectedObjectId` drives the inspector and can open the matching proof claim.
- `proofId` opens the origami proof card for the selected step or object.
- `selectedProofClaimId` and `hoveredProofClaimId` add proof-claim object IDs to
  the canvas highlight set, with hover taking temporary precedence.

These states do not import or mutate compass-and-straightedge interaction state.
The function lab uses its own React state inside the origami tab, so entering an
invalid sampled function can block future animation work without changing the
current compass-and-straightedge expression or reveal state.
Compiling a function stores an origami-local preview plan and animation state.
Workspace-switching regression tests verify that advancing this preview does not
reset the compass-and-straightedge expression, reveal progress, or constructed
scene, and that the origami preview phase is still present when returning to the
flat-origami tab.

## Responsive Layout

The origami explanation view uses four readable regions: SVG canvas, step list,
object inspector, and proof card. On desktop the canvas and step list share the
first row, while the inspector and proof card span the full workspace below.
The step list and proof card have bounded heights with internal scrolling so
long metadata or proof text does not push the canvas out of view.

Below the mobile breakpoint, the regions stack into one column. Example tabs
scroll horizontally, range controls shrink inside the header, metadata tiles
collapse from two columns to one on narrow screens, and inspector/proof text
wraps within its panel instead of overflowing.

`npm run smoke:browser` saves deterministic origami workspace screenshots after
the desktop and mobile visual-contract checks. The generated files live in
`.artifacts/browser-smoke/` with names such as `origami-1280x900.png` and
`origami-390x844.png`. The `.artifacts/` directory is intentionally ignored by
git so local smoke runs do not create binary churn.

## Current Limits

The N2 renderer visualizes deterministic explanation geometry for the supported
arithmetic traces. It does not yet solve full physical folding sequences or
assign final mountain/valley choices. Creases remain candidates until a later
fold-solver milestone can prove a physical sequence and export those assignments
as more than display metadata.
