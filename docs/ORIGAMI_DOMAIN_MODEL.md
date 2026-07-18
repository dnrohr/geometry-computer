# Origami Domain Model

The flat-origami track uses its own scene model under `src/domain/origami`.
These types intentionally do not import or extend the existing
compass-and-straightedge construction trace. The only planned early shared
boundary is expression parsing, introduced later by the origami compiler.

## Scene Shape

An `OrigamiFoldScene` contains:

- `objects`: paper boundary, points, lines, creases, segments, reflected points,
  and labels.
- `steps`: fold operations with input objects, created objects, output objects,
  the selected fold solution, and optional degeneracy notes.
- `proofs`: origami-specific proof records for fold axioms and later arithmetic
  macros.

All IDs are stable strings in fixtures and generated scenes. Objects carry
provenance through `sourceObjectIds`, optional expression metadata, optional
macro metadata, and the fold step that produced them.

## Folds and Branches

Fold steps name a Huzita-Hatori-style axiom such as `point-to-point`,
`point-to-line`, or `line-to-line`. A step may produce more than one geometric
solution, so the chosen branch is recorded as `selectedSolutionId`.

Mountain/valley assignment is represented on crease objects as optional
computation metadata. Early arithmetic traces can operate on flat crease
geometry without committing to a physical folding sequence.

The first fold axiom templates are deterministic:

- `point-to-point` returns the perpendicular-bisector crease and rejects
  coincident points.
- `point-to-line` uses the perpendicular projection of the point onto the target
  line as the selected image point; a point already on the line is treated as an
  ambiguous family of folds.
- `line-to-line` returns sorted angle-bisector solutions for intersecting lines,
  the midline solution for distinct parallel lines, and an ambiguous-fold error
  for coincident lines.

These branch choices are intentionally simple so early arithmetic examples can
be tested without a general fold solver.

## First Arithmetic Compiler Slice

`compileOrigamiExpression` is a separate compiler entry point under
`src/domain/origami/compiler`. It accepts the shared parsed expression AST, then
emits origami-only scene objects and arithmetic macro steps. It does not import
the compass-and-straightedge compiler.

The first supported trace slice covers variables, constants, addition, and
subtraction on a deterministic baseline. Multiplication, division, square, and
square root are represented in the roadmap but intentionally remain unsupported
until the corresponding fold macro fixtures are implemented.

Cubic roots and angle trisection are research spikes. They require the more
advanced tangent/parabola family of folds and should not be treated as acceptance
criteria for the basic arithmetic compiler.

## Degeneracy Handling

Degeneracy notes are first-class data rather than comments. Supported categories
include coincident points, parallel lines, ambiguous solutions, no-solution
cases, and folds that leave the modeled paper boundary.

The validator rejects structurally invalid scenes, including duplicate IDs,
missing references, non-finite coordinates, and zero direction vectors. Valid
degenerate mathematical cases should be represented with `degeneracies` on the
fold step once the relevant axiom template supports them.

## Isolation Rule

Compass-and-straightedge compiler, construction macro, SVG renderer, proof card,
export, and example modules must not import from `src/domain/origami` during the
separate-track phase. Shared abstractions should wait until both systems have
implemented and tested the same arithmetic family.
