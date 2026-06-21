# Milestone 3: Geometric construction diagrams

Milestone 3 turns the expression dependency plan into inspectable compass-and-straightedge construction schematics.

## Delivered

- A typed construction plan containing operation kinds, references, numeric operands, results, and readable instructions.
- A geometry-independent drawing model made of points, lines, arcs, circles, and labels.
- Operation-specific methods: segment concatenation and difference, similar-triangle proportional constructions for multiplication and division, and the semicircle geometric-mean construction for square roots.
- An accessible SVG renderer with result highlighting and text descriptions.
- Interactive step selection in the workbench so every derived length can be inspected independently.
- Unit and integration coverage for expression-to-plan conversion, all five geometric methods, result annotations, and UI navigation.

## Interpretation

The diagrams are normalized schematics rather than scale drawings. This keeps very large, very small, and nested values legible while preserving the incidence relationships that define each construction. Arithmetic may use directed lengths; the displayed numeric result records direction when subtraction produces a negative value.

## Acceptance checks

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
```
