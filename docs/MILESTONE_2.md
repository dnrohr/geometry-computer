# Milestone 2: Constructible expression core

Milestone 2 establishes the algebraic domain layer that geometric rendering will consume.

## Delivered

- A tokenizer and precedence-aware parser for decimal constants, parentheses, `+`, `-`, `*`, `/`, and `sqrt(...)`.
- A typed expression tree with pure evaluation and explicit domain errors.
- Dependency-ordered operation descriptions, labeled `L1`, `L2`, and so on, that can become geometric construction steps in a later milestone.
- An accessible, responsive React workbench with examples, live results, operation plans, and inline error feedback.
- Unit and integration coverage for parsing, precedence, nested roots, invalid syntax, invalid real-length operations, plan ordering, and UI state.

## Boundaries

This milestone does not draw compass-and-straightedge primitives. It defines the input and dependency model those primitives will consume. Named variables, implicit multiplication, powers other than square roots, complex values, and symbolic simplification are also intentionally outside this milestone.

## Acceptance checks

Run the full project verification suite:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
```
