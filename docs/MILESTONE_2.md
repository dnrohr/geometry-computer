# Milestone 2: Domain models

Milestone 2 establishes rendering-independent symbolic expression, construction trace, and geometry object models.

## Delivered

- A symbolic expression AST with helper constructors and stable plain-text and LaTeX formatting.
- Original and simplified polynomial examples.
- Construction nodes, macro/primitive steps, proof claims, operation proofs, and reveal actions.
- A hardcoded macro trace for `(3a + b)(a + b)` with validated references.
- Geometry objects for points, segments, lines, rays, circles, arcs, labels, and triangles.
- Required provenance metadata plus deterministic coordinate and tolerance helpers.
- Unit tests and `docs/DOMAIN_MODEL.md`.

The pre-existing numeric parser is retained as early work for the later parsing milestone and is not the Milestone 2 symbolic model.
