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

## Current Limits

The O4 renderer visualizes deterministic trace geometry. It does not yet render
full physical folding sequences, mountain/valley solving, or all intermediate
crease constructions for multiplication, division, and square root. Those details
belong in later fold-solver and proof-expansion work.
