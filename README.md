# Geometry Computer

Geometry Computer turns algebraic expressions into interactive Euclidean and origami construction narratives. Enter an expression, assign numeric sample values, inspect the generated geometry and provenance, play each construction, and export JSON, SVG, or optional ManimGL video.

Scroll through the generated macro and primitive steps while the SVG remains sticky. Each arithmetic macro emits its canonical construction geometry, explicit intersection selection, result extraction, proof links, and reversible object/step provenance.

## Run locally

```bash
npm install
npm run dev
```

Quality gates are `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run format:check`.

## Expression syntax

Variables, decimal or integer constants, `+`, `-`, `*`, `/`, integer powers, parentheses, and `sqrt(...)` are supported by the shared parser. The Origami tab additionally supports `cbrt(...)` and `cubic(a,b,c,d,index)`, where `index` selects a distinct real root of `a*x^3+b*x^2+c*x+d` in ascending order. Multiplication must be explicit: use `3*a`, not `3a`.

The built-in gallery covers addition, directed subtraction, multiplication and division by similar triangles, squaring, square root by geometric mean, and polynomial examples. Numeric values choose a readable drawing scale; symbolic expressions and provenance remain attached to every object.

See [Getting Started](docs/GETTING_STARTED.md), [UI Specification](docs/UI_SPECIFICATION.md), [Mathematical Background](docs/MATH_BACKGROUND.md), [Architecture](docs/ARCHITECTURE.md), and [Export Format](docs/EXPORT_FORMAT.md).

The general origami compute design and status are in [its roadmap](docs/ORIGAMI_COMPUTE_ROADMAP.md); clean-Windows and release checks are in [Origami compute release readiness](docs/ORIGAMI_COMPUTE_RELEASE.md).
