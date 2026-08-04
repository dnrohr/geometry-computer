# Huzita–Hatori axiom kernel

The TypeScript origami domain exposes formal, renderer-independent solvers for O1 through O7 in `src/domain/origami/axioms.ts`.

## Supported constraints

| Axiom | Computed crease constraint |
| --- | --- |
| O1 | Pass through two distinct points. |
| O2 | Reflect one point onto another point. |
| O3 | Reflect one line onto another line; return every distinct real angle-bisector branch. |
| O4 | Pass through a point perpendicular to a line. |
| O5 | Reflect a point onto a line while passing through another point. |
| O6 | Reflect two points onto two respective lines simultaneously. |
| O7 | Reflect a point onto a line while remaining perpendicular to another line. |

Each solver returns an `AxiomSolution` containing its axiom ID, description, assumptions, degeneracy notes, and deterministically ordered `AxiomCandidate` values. A candidate includes its canonical crease, constraint residuals, maximum residual, optional O3 branch, and optional O6 cubic parameter.

`solveAxiom` accepts a discriminated `AxiomRequest` when callers need a uniform dispatch boundary.

## O6 cubic solver

O6 parameterizes the first reflected target along its target line. The perpendicular-bisector crease for that target is substituted into the second point-on-line constraint. After clearing the squared-distance denominator, the result is a real polynomial of degree at most three.

The root isolator:

- Trims numerically zero leading coefficients, allowing linear and quadratic degeneracies.
- Uses derivative critical points and a Cauchy root bound for cubic isolation.
- Detects repeated roots at critical points.
- Bisects sign-changing intervals deterministically.
- Deduplicates roots and discards roots that do not define a nondegenerate crease.

Reference tests cover no real nondegenerate crease and one, two, and three certified real crease candidates.

## Canonical ordering and tolerances

Line direction is canonicalized to the positive half-plane, and the line point is projected to the closest point to the origin. Candidates are ordered by canonical direction angle and signed offset. Candidate identity therefore does not depend on root discovery order or input line orientation.

Every candidate is checked against its defining constraints. `AXIOM_RESIDUAL_TOLERANCE` is `1e-7`; a non-finite or larger maximum residual produces `AXIOM_RESIDUAL_FAILURE` rather than returning an uncertified candidate. The underlying geometric degeneracy threshold remains `ORIGAMI_EPSILON = 1e-9`.

These tolerances certify the numeric geometric result within the documented model. They are separate from the exact algebraic equality and certified-root representation planned for the next general-compute milestone.

## Degeneracy behavior

Solvers fail with explicit `OrigamiError` codes for cases such as coincident O1/O2 points, coincident O3 lines, no-real O5/O6 folds, and an underdetermined O7 perpendicular constraint. Tangent, parallel, repeated-root, and discarded-degenerate-root conditions are exposed in solution degeneracy notes when a valid solution still exists.
