# Geometry Computer

Geometry Computer turns arithmetic expressions into interactive compass-and-straightedge construction narratives. Enter an expression, assign numeric sample values, inspect the generated geometry and provenance, open operation proofs, scrub reveal progress, and export the result as JSON or SVG.

Scroll through the generated macro and primitive steps while the SVG remains sticky. Each arithmetic macro emits its canonical construction geometry, explicit intersection selection, result extraction, proof links, and reversible object/step provenance.

The app also includes a separate flat-origami tab. That workspace now has two
origami-only surfaces: an arithmetic trace gallery for crease-pattern examples
and a fold-computed function lab. The function lab accepts allowable real-valued
expressions such as `f(a)=sqrt(a+1)`, validates sampled inputs, animates a
square two-sided paper fold sequence, and keeps the fold storyboard, expression
progress, dependency highlights, measurement labels, ambiguity warnings, and
function object inspector local to the origami tab. Function animations can be
exported as JSON, current/final/crease SVG snapshots, or animated SVG, and saved
animation JSON can be imported for replay.

Origami computation is intentionally isolated for now so the current
compass-and-straightedge workspace remains stable while fold-based models,
proofs, paper styling, exports, and crease-pattern rendering are explored.

## Run locally

```bash
npm install
npm run dev
```

Quality gates are `npm test`, `npm run typecheck`, `npm run lint`,
`npm run build`, `npm run format:check`, and `npm run smoke:browser`. The
browser smoke command starts its own Vite server and fails on page errors or
unexpected console errors.

## Expression syntax

Variables, decimal or integer constants, `+`, `-`, `*`, `/`, `^2`, parentheses, and `sqrt(...)` are supported. Multiplication must be explicit: use `3*a`, not `3a`. Division by zero, negative real square roots, and powers other than two produce readable domain errors.

The built-in gallery covers addition, directed subtraction, multiplication and division by similar triangles, squaring, square root by geometric mean, and polynomial examples. Numeric values choose a readable drawing scale; symbolic expressions and provenance remain attached to every object.

See [Getting Started](docs/GETTING_STARTED.md), [UI Specification](docs/UI_SPECIFICATION.md), [Mathematical Background](docs/MATH_BACKGROUND.md), [Origami Math Background](docs/ORIGAMI_MATH_BACKGROUND.md), [Origami Domain Model](docs/ORIGAMI_DOMAIN_MODEL.md), [Origami Rendering](docs/ORIGAMI_RENDERING.md), [Origami Merger Review](docs/ORIGAMI_MERGER_REVIEW.md), [Architecture](docs/ARCHITECTURE.md), and [Export Format](docs/EXPORT_FORMAT.md).
