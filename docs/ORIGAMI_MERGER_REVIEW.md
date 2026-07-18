# Origami Merger Readiness Review

Status: keep the compass-and-straightedge and flat-origami workspaces separate.

This review compares the first completed common arithmetic family, addition,
across both systems. The goal is to identify where convergence is justified and
where the systems still need room to differ.

## Evidence

Compatibility coverage lives in `src/domain/mergerReadiness.test.ts`.

The test compiles `a+b` through:

- `compileExpression`, the compass-and-straightedge compiler.
- `compileOrigamiExpression`, the flat-origami compiler.

It verifies:

- Both compilers accept the same parsed expression AST.
- Both produce the sampled numeric value `5` for `a=3`, `b=2`.
- Both traces include an addition operation.
- Both result objects preserve expression provenance.
- Object IDs remain in separate namespaces.

## Shared Concepts

These concepts appear compatible enough to keep aligned:

- Parsed expression AST as the input boundary.
- Sampled numeric values for examples and tests.
- Operation names for arithmetic families.
- Result provenance tied back to formatted expressions.
- Proof references attached to generated steps.
- JSON-safe scene data.

## Similar but Not Identical

These concepts should stay separate until more evidence accumulates:

- Step models: compass-and-straightedge steps distinguish macro and primitive
  construction levels; origami steps distinguish arithmetic macros and fold
  axioms.
- Rendered objects: compass geometry includes circles, rays, arcs, triangles,
  and construction scaffolding; origami geometry includes paper boundaries,
  creases, fold assignments, and reflected objects.
- Reveal behavior: both use progressive reveal, but origami reveal is tied to
  fold traces and crease-pattern objects.
- Proofs: compass proofs justify Euclidean construction macros; origami proofs
  justify fold axioms and fold arithmetic traces.

## System-Specific Concepts

These should not be hidden behind a shared abstraction yet:

- Huzita-Hatori axiom selection and branch ordering.
- Mountain/valley assignment.
- Fold degeneracy categories.
- Compass circle/ray/arc construction scaffolding.
- Clean final compass construction extraction.
- Origami crease-pattern export expectations.

## Decision

Do not merge the compiler, renderer, export, or proof paths yet. The only shared
boundary remains expression parsing. A shared operation-trace interface may be
worth revisiting after both systems have expanded at least one arithmetic family
with comparable proof depth and rendered intermediate geometry.

For now, keep the separate tabs. A construction-system selector should wait
until both systems can compile, render, inspect, prove, and export the same
arithmetic family without losing the differences that make each construction
system understandable.
