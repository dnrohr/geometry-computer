# Origami Math Background

The flat-origami track treats folds as computation steps. The current
implementation is a deterministic trace model: it records the arithmetic
dependency, selected fold branch, sampled result length, and proof metadata. It
does not yet claim to be a full physical folding simulator.

## Implemented Fold Axioms

The first axiom templates live in `src/domain/origami/axioms`.

### Point to Point

Given two distinct points `A` and `B`, the fold mapping `A` onto `B` is the
perpendicular bisector of segment `AB`.

Degeneracy: coincident points are rejected because infinitely many folds pass
through the same point while mapping it to itself.

### Point to Line

Given a point `P` and a target line `l`, the current deterministic template uses
the perpendicular projection of `P` onto `l` as the selected image point. The
crease is then the perpendicular bisector between `P` and that projected point.

Degeneracy: if `P` is already on `l`, the template reports an ambiguous family
of folds.

### Line to Line

Given two lines, the fold aligning one line to the other is represented by angle
bisectors when the lines intersect. Distinct parallel lines align by folding
along their midline.

Degeneracy: coincident lines are ambiguous because there is no unique alignment
fold.

## Implemented Arithmetic Traces

The compiler supports variables, constants, addition, subtraction,
multiplication, division, square, and square root. Each operation emits a
baseline segment with expression provenance plus a crease marker for the
corresponding fold trace.

- Variables and constants mark known directed lengths.
- Copy-length traces make repeated use of a known length visible as a transfer
  step.
- Addition concatenates directed lengths on a baseline.
- Subtraction transfers the second length in the opposite direction.
- Multiplication records an intercept-style scale trace with a unit reference,
  copied factor segments, ratio and parallel guide lines, a selected scaled
  point, and projection creases.
- Division records an intercept-style reciprocal scale trace with a nonzero
  denominator check, unit reference, numerator and denominator copies,
  reciprocal and quotient guide lines, selected reciprocal/quotient points, and
  projection creases.
- Square is multiplication with the same source length in both roles; the
  compiler keeps the copied second factor visible and reuses the multiplication
  guide geometry.
- Square root records a geometric-mean trace with a nonnegative-input check,
  unit-plus-input baseline, midpoint, fold-equivalent guide, positive selected
  square-root point, and perpendicular extraction creases.

The advanced arithmetic traces now expose intermediate geometry for
multiplication, division, square, and square root. Later fold-solver work should
refine these guides into stricter physical fold certificates where needed.

## N1 Macro Trace Contract

Advanced arithmetic work should expand the existing `macroTrace` on each
arithmetic fold step instead of inventing a second trace format. The contract is
designed to hold both today's simple baseline traces and the later full
constructions:

- multiplication and division should add unit references, guide lines, copied
  input lengths, projected or scaled points, selected intersections, and result
  segments.
- square should reuse the multiplication contract while preserving the duplicated
  input provenance.
- square root adds the unit-plus-input baseline, midpoint, auxiliary
  fold-equivalent guide, extraction creases, selected intersection,
  nonnegative-input assumption, and result segment.

Every populated object-reference slot in the contract is validated against the
scene. Every proof claim listed by the contract must exist in the scene proofs.
This keeps explanatory rendering and future export work anchored to typed scene
data rather than ad hoc label matching.

### Advanced Arithmetic Contracts

Multiplication uses the selected branch `mul-intercept-similar-triangle`.
Its assumptions are a positive displayed unit reference and two copied factor
segments placed on deterministic guide axes. The trace records one unit segment,
two guide lines, three crease objects, one selected scaled point, and one result
segment. The result segment provenance includes both factor segment IDs.

Division uses the selected branch `div-reciprocal-intercept`. Its assumptions
are a positive displayed unit reference and a nonzero denominator; zero is
rejected before scene creation with `DIVISION_BY_ZERO`. The trace records one
unit segment, numerator and denominator copies, reciprocal and quotient guide
lines, three crease objects, selected reciprocal and quotient points, and one
result segment.

Square uses the selected branch `square-multiplication-specialization`. Its
assumption is that the second factor is a visible copy of the source length, not
an implicit reuse. The trace therefore keeps two source segment IDs and reuses
the multiplication unit, guide, crease, selected-intersection, and result slots.

Square root uses the selected branch `sqrt-geometric-mean`. Its assumption is a
nonnegative sampled radicand; negative values are rejected before scene creation
with `NEGATIVE_SQUARE_ROOT`. The trace records the unit-plus-input baseline,
midpoint, fold-equivalent geometric-mean guide, positive selected square-root
point, perpendicular extraction creases, and one result segment. The current
domain has no circle object, so the auxiliary circle is represented by typed
guide-line and selected-intersection objects until a later fold certificate
model needs stricter physical detail.

## Branch and Error Policy

Every deterministic branch choice must be visible in either the selected
solution ID, proof text, degeneracy notes, or tests. Invalid cases should fail
with origami-specific errors instead of falling through to
compass-and-straightedge errors.

Compiled arithmetic scenes also reject sampled values or intermediate results
that are not finite real lengths with `NO_REAL_SOLUTION`. Very large finite
values can be mathematically valid but too large for the current explanatory
paper scale; those fail before scene creation with `FOLD_OUTSIDE_PAPER` so the
UI can report a scale issue instead of rendering a misleading partial trace.

## Research Spikes

Cubic roots and angle trisection remain research spikes. They require the
tangent/parabola family of origami folds and should not be treated as supported
arithmetic compiler features until the fold solver, proof fixtures, and renderer
can expose the required branches clearly.
