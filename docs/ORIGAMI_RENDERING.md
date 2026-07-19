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

## Interaction

The flat-origami tab provides:

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

## Current Limits

The O4 renderer visualizes deterministic trace geometry. It does not yet render
full physical folding sequences, mountain/valley solving, or all intermediate
crease constructions for multiplication, division, and square root. Those details
belong in later fold-solver and proof-expansion work.
