# Geometry Computer

Geometry Computer turns arithmetic expressions into interactive compass-and-straightedge construction narratives. Enter an expression, assign numeric sample values, inspect the generated geometry and provenance, open operation proofs, scrub reveal progress, and export the result as JSON or SVG.

## Run locally

```bash
npm install
npm run dev
```

Quality gates are `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run format:check`.

## Expression syntax

Variables, decimal or integer constants, `+`, `-`, `*`, `/`, `^2`, parentheses, and `sqrt(...)` are supported. Multiplication must be explicit: use `3*a`, not `3a`. Division by zero, negative real square roots, and powers other than two produce readable domain errors.

The built-in gallery covers addition, directed subtraction, multiplication and division by similar triangles, squaring, square root by geometric mean, and polynomial examples. Numeric values choose a readable drawing scale; symbolic expressions and provenance remain attached to every object.

See [Getting Started](docs/GETTING_STARTED.md), [Mathematical Background](docs/MATH_BACKGROUND.md), [Architecture](docs/ARCHITECTURE.md), and [Export Format](docs/EXPORT_FORMAT.md).
