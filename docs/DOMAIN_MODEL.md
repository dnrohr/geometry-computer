# Domain model

The application separates symbolic expressions, construction traces, and drawable geometry so the mathematical logic can be tested without React.

## Expression AST

`src/domain/expression` defines constants, variables, addition, subtraction, multiplication, division, integer powers, and square roots. Helper constructors build immutable AST values. Plain-text and LaTeX formatters use stable precedence-aware output. The polynomial example is stored in both original and manually simplified forms.

## Construction traces

`src/domain/construction` describes macro and primitive construction steps independently from rendering. Nodes connect algebraic inputs to output object IDs. Steps record their input, output, and created geometry IDs. Reveal actions describe future timeline behavior, while operation proofs connect claims to highlighted geometry.

The polynomial trace is deliberately macro-level at this milestone. Later macro generators will expand these steps into primitive straightedge-and-compass moves.

## Geometry objects

`src/domain/geometry` contains points, segments, lines, rays, circles, arcs, labels, and triangles. Every object carries a stable ID, semantic role, creating step, consumers, dependencies, and an optional represented expression. Constructors require this provenance metadata.

Coordinates are illustrative SVG coordinates rather than symbolic proof data. Shared helpers provide distances, midpoints, viewport conversion, and tolerance-aware numeric comparisons.
