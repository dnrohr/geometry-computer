# General Origami Compute Roadmap

## Objective

Add a general expression compiler to the Origami tab analogous to the Euclidean compiler. Given an algebraic expression and variable values, the system should determine whether the value is origami-constructible, generate a deterministic sequence of valid folds, explain every branch and assumption, and play or export the resulting construction through the existing 2D, 3D, JSON, session, and ManimGL systems.

The Origami and Euclidean workflows remain separate top-level tabs. They may share parsing, algebra, proof, export, and timeline infrastructure internally.

## Mathematical scope

The initial language should support:

- Rational constants and supplied variables.
- Addition, subtraction, multiplication, and division.
- Square roots.
- Real cube roots.
- Selected real roots of supported cubic polynomials.
- Composition of the operations above where every intermediate result is real and constructible.

The compiler does not claim to construct arbitrary real numbers. It accepts only values supported by the implemented origami-constructible algebra and fold axioms.

Every numeric result must be accompanied by an exact or certified algebraic representation. Floating-point approximations are presentation and geometric-evaluation aids, not the proof of constructibility.

## Architectural boundary

```text
expression + variable values
            |
            v
parser and algebraic normalizer
            |
            v
constructibility analysis
            |
            v
origami construction planner
            |
            v
branch-resolved fold program
            |
            v
versioned multi-fold session
       /          |          \
      v           v           v
 browser 2D   browser 3D   ManimGL
```

The planner owns algebra-to-geometry choices. Renderers must not solve polynomials, choose crease candidates, or infer proof branches.

## Milestone 1 — Complete fold-axiom kernel

Status: completed on the `origami` branch on 2026-08-03. The renderer-independent TypeScript domain now exposes typed O1–O7 requests and solutions, canonical crease candidates, constraint residual certification, deterministic branch ordering, explicit degeneracy codes, and formal wrappers around the audited existing operations. O6 derives and isolates its degree-at-most-three constraint polynomial and is tested for zero through three valid candidates; O7 uses its finite perpendicular-offset solution. Details and tolerances are documented in `ORIGAMI_AXIOMS.md`.

### Tasks

- Define typed requests, solutions, branches, assumptions, and degeneracies for Huzita–Hatori axioms O1 through O7.
- Audit existing point-to-point, line-to-line, parallel, through-point, and point-to-line-through-point operations against the formal axiom definitions.
- Implement the missing axioms, prioritizing O6 because it provides the cubic-solving construction.
- Represent every crease candidate explicitly and deterministically.
- Add certified residual checks for point-on-line, reflected-point, line-coincidence, and through-point constraints.
- Define stable candidate ordering independent of runtime or floating-point incidental ordering.
- Detect no-real-solution, tangent, repeated-root, coincident, parallel, and zero-direction degeneracies.
- Document the geometric tolerance policy separately from algebraic equality.

### Acceptance criteria

- O1–O7 have numeric, branch, degeneracy, and provenance tests.
- Every returned crease satisfies its defining constraints within the documented tolerance.
- Candidate ordering is deterministic.
- O6 reference cases produce one, two, or three real crease candidates as mathematically expected.
- No renderer dependency is required for the axiom tests.

## Milestone 2 — Exact origami algebra kernel

Status: completed on the `origami` branch on 2026-08-03. A renderer-independent exact kernel now provides normalized BigInt rationals, canonical integer defining polynomials, exact polynomial arithmetic and GCD identity checks, Sturm-certified rational isolating intervals, resultants for algebraic sums and products, field operations, real square and cube roots, deterministic serialization, operation provenance, exact/symbolic/decimal presentations, and explicit degree, coefficient, and resultant-size limits. Details are documented in `ORIGAMI_ALGEBRA.md`.

### Tasks

- Define an `OrigamiNumber` representation for rational, quadratic-extension, and cubic algebraic values.
- Use normalized integer or rational polynomials plus an isolating interval or equivalent certified root identity.
- Implement exact equality and deterministic canonical serialization.
- Implement addition, subtraction, multiplication, division, negation, comparison where certified, square root, and real cube root.
- Implement minimal-polynomial or defining-polynomial propagation with degree controls.
- Isolate real roots and distinguish multiple real roots without relying on display precision.
- Track the algebraic operation DAG and originating expression node.
- Add configurable complexity limits for degree, coefficient size, and isolation work.
- Produce readable exact, symbolic, and decimal presentations.

### Acceptance criteria

- Algebraic equality does not depend on approximate decimal equality.
- Rational, quadratic, and cubic reference values round-trip through canonical serialization.
- Repeated evaluation produces identical algebraic identities and root ordering.
- Unsupported degree growth fails with an explicit constructibility or complexity explanation.
- Numeric approximations have a certified error bound suitable for geometric placement.

## Milestone 3 — Expression language and constructibility analysis

Status: completed on the `origami` branch on 2026-08-03. The shared parser now accepts real cube roots and explicit indexed cubic roots while retaining existing Euclidean syntax. A renderer-independent analyzer converts finite decimals to exact rationals, evaluates through the exact origami algebra kernel, reuses common subexpressions in a deterministic DAG, classifies Euclidean and origami-only expressions, and reports the first invalid or unsupported subexpression before geometric planning. Syntax and diagnostics are documented in `ORIGAMI_EXPRESSIONS.md`.

### Tasks

- Extend the shared expression language with `cbrt(...)` and an explicit supported cubic-root form.
- Define syntax for selecting a real root when a cubic has multiple real roots.
- Preserve compatibility with existing Euclidean expressions.
- Normalize expressions into an algebraic operation DAG with common-subexpression reuse.
- Classify expressions as Euclidean-constructible, origami-only constructible, invalid, or beyond configured support.
- Reject division by zero, non-real intermediate roots, missing variables, and unsupported operations before geometric planning.
- Report the first unsupported subexpression with a plain-language explanation.
- Add parser, normalization, classification, and diagnostic tests.

### Acceptance criteria

- Existing Euclidean gallery expressions retain their current meaning.
- `cbrt(2)`, supported cubics, and mixed quadratic/cubic expressions receive exact algebraic results.
- Invalid and non-real expressions fail before paper geometry is created.
- Classification is deterministic and exposes why origami is required.

## Milestone 4 — Origami construction templates

Status: completed on the `origami` branch on 2026-08-03. Renderer-independent templates now cover unit placement, field operations, reciprocal, square root, cube root, and explicit cubic roots. Instances carry bounded coordinate frames, preconditions, exact outputs, formal axiom requests, certified candidates, rejected branches, unfold behavior, and proof claims. Cube and cubic roots use a documented direct polynomial-to-O6 mapping, and template verification checks both directed-value and axiom residual tolerances. See `ORIGAMI_CONSTRUCTION_TEMPLATES.md`.

### Tasks

- Define reusable, parameterized fold templates for unit placement and arithmetic operations.
- Add templates for reciprocal, product, quotient, square root, cube root, and supported cubic roots.
- Specify paper setup, coordinate frames, reference marks, target lines, required unfold operations, and safe margins for each template.
- Encode template preconditions and degeneracies.
- Produce domain-level proof claims connecting each template's geometry to its algebraic operation.
- Normalize and rescale constructions to keep points and creases within practical paper bounds.
- Add reference constructions for `a+b`, `a*b`, `1/a`, `sqrt(a)`, `cbrt(a)`, and a three-real-root cubic.

### Acceptance criteria

- Each template constructs its exact algebraic target within certified geometric tolerance.
- Templates contain no renderer-authored target polygons or crease choices.
- Branch-sensitive templates require an explicit algebraic-root and geometric-crease mapping.
- Template proofs identify givens, constraints, branch choice, and conclusion.

## Milestone 5 — Expression-to-fold planner

Status: completed on the `origami` branch on 2026-08-03. A pure deterministic planner now visits the normalized algebra DAG in dependency order, reuses common subexpressions, instantiates bounded templates, resolves formal axiom candidates before rendering, and emits a versioned compute plan plus playable multi-fold origami session. Stable mappings connect expression nodes, templates, fold IDs, exact values, branches, and paper state. Recoverable diagnostics cover analysis, coefficient, power, and layout limits. See `ORIGAMI_COMPUTE_PLANNER.md`.

### Tasks

- Translate the normalized algebraic DAG into a dependency-ordered fold program.
- Reuse shared subexpressions instead of reconstructing them.
- Allocate paper regions and coordinate frames for intermediate values.
- Decide when paper must remain folded, unfold, or move to a fresh reference region.
- Track physical paper state, face lineage, layers, and accumulated creases through the complete program.
- Resolve every multi-candidate axiom using the exact algebraic target and certified residuals.
- Record rejected candidates and the reason for the selected branch.
- Add planning limits and recoverable diagnostics for layout, layer, collision, or complexity failures.
- Compile the program into the versioned origami-session schema.

### Acceptance criteria

- The planner compiles all arithmetic and radical reference expressions into playable sessions.
- Identical inputs produce identical fold IDs, candidates, geometry, timing, and proofs.
- Every selected crease maps to the intended exact algebraic root.
- Failed planning leaves the previous valid construction unchanged.
- At least one mixed expression containing arithmetic, a square root, and a cube root compiles end to end.

## Milestone 6 — General-compute Origami UI

Status: completed on the `origami` branch on 2026-08-03. The independent Origami tab now accepts expressions and variable assignments, compiles explicitly into the generated fold session, preserves its previous result on failure, and displays symbolic/exact/decimal results, constructibility, algebraic degree, required axioms, and fold count. Its normalized expression trace synchronizes node selection with generated folds and visually marks origami-only nodes. Guided authoring and examples remain a separate section in the same tab, while Euclidean and Origami state remain independently mounted. See `ORIGAMI_COMPUTE_UI.md`.

### Tasks

- Add an expression and variable-value input to the existing Origami tab.
- Keep guided fold authoring and examples available as a separate section within the tab.
- Show exact result, decimal approximation, constructibility classification, algebraic degree, and required axioms.
- Compile on explicit user action and preserve the previous result on failure.
- Add an expression tree synchronized with the fold trace and paper objects.
- Highlight origami-only operations and branch-selection points.
- Present complexity-limit, non-real, unsupported, and degeneracy errors in plain language.
- Provide example expressions spanning rational, quadratic, cubic, and mixed constructions.
- Preserve independent Euclidean and Origami expression state across tab switches.

### Acceptance criteria

- A user can enter `cbrt(2)`, compile it, and play the generated fold session without editing JSON.
- Selecting an expression node highlights the folds and objects that construct it.
- Exact and approximate results are clearly distinguished.
- Euclidean and Origami tabs retain separate expressions, values, timelines, and selections.

## Milestone 7 — Proofs, inspection, and educational narrative

Status: completed on the `origami` branch on 2026-08-03. Generated session folds now retain stable expression/template/fold linkage, exact defining polynomials, isolating intervals, all certified crease candidates, selected and rejected branches, residuals, layered algebraic/geometric proof claims, and physical instructions. The Origami algebra inspector exposes this data and synchronizes expression selection with playback. Canonical session export/import round-trips the provenance for offline explanation. See `ORIGAMI_COMPUTE_PROOFS.md`.

### Tasks

- Generate a proof chain from expression identity through algebraic value and fold constraints.
- Explain how each selected Huzita–Hatori axiom realizes the required algebraic operation.
- Show all real cubic roots and explain which root and crease branch were selected.
- Add inspectors for algebraic numbers, defining polynomials, isolating intervals, residuals, and geometric dependencies.
- Synchronize narration, proof claims, expression nodes, fold phases, and canvas highlighting.
- Add physical folding instructions that distinguish mathematical idealization from practical paper execution.
- Export proof and provenance data through the canonical session and render-document formats.

### Acceptance criteria

- Every generated fold has a traceable algebraic and geometric justification.
- Cubic examples expose alternative real roots without presenting them as accidental numeric candidates.
- Proof claims link to stable expression, step, crease, and object IDs.
- Exported sessions retain enough provenance to reconstruct the explanation offline.

## Milestone 8 — Rendering, parity, performance, and release readiness

Status: completed on the `origami` branch on 2026-08-03. Complete computed sessions now render through the existing browser 2D/3D and flat/hinge ManimGL paths; the localhost service accepts a full session and combines collision-free IDs and offset timing into one canonical render document. Exact radical/cubic golden signatures, nine-expression branch/geometry parity, interactive budgets, Unicode/space paths, cancellation cleanup, and renderer regressions are automated. Clean-Windows setup, dependency locks, licensing, accessibility, performance budgets, and known limits are documented in `ORIGAMI_COMPUTE_RELEASE.md`.

### Tasks

- Render complete computed sessions in browser 2D, browser 3D, flat ManimGL, and hinge ManimGL modes.
- Extend the local rendering service to accept complete origami sessions or a canonical combined render document.
- Add golden states for arithmetic, square-root, cube-root, and cubic constructions.
- Compare exact final geometry, selected branches, and key visual states across renderers.
- Benchmark algebra, planning, browser playback, and Manim rendering separately.
- Define interactive and rendering budgets for representative expression sizes.
- Add cancellation and cleanup tests for long cubic sessions.
- Test Unicode expressions, variable names where supported, and paths containing spaces and non-ASCII characters.
- Complete accessibility, reduced-motion, high-contrast, keyboard, and responsive workflow checks.
- Update environment locks, format documentation, licensing notes, and clean-Windows release steps.

### Acceptance criteria

- All reference expressions produce deterministic exact results and equivalent renderer geometry.
- Standard expressions compile within the documented interactive budget.
- Long renders can be cancelled without abandoned temporary files.
- A clean Windows setup can compile and render `cbrt(2)` from the UI.
- Ordinary Euclidean and domain tests remain independent of WebGL, ManimGL, and ffmpeg.

## Reference expression suite

The initial release suite should include:

1. `a + b` — shared arithmetic baseline.
2. `a * b` — proportional construction.
3. `1 / a` — reciprocal and zero guard.
4. `sqrt(a)` — Euclidean-compatible radical rendered as origami.
5. `cbrt(2)` — canonical origami-only construction.
6. `cbrt(a) + sqrt(b)` — mixed extension construction.
7. A cubic with one real root.
8. A cubic with three distinct real roots and explicit root selection.
9. A repeated-root cubic.
10. A deliberately unsupported expression whose degree or complexity exceeds configured limits.

## Testing strategy

1. **Exact algebra tests** — canonical identities, field operations, polynomial roots, isolation, and serialization.
2. **Axiom tests** — geometric constraints, branches, degeneracies, and deterministic candidate ordering.
3. **Template tests** — algebraic target versus constructed geometric length.
4. **Planner tests** — dependency order, reuse, layout, branch mapping, lineage, and stable IDs.
5. **Contract tests** — expression plans, sessions, render documents, browser, and Python validators agree.
6. **Workflow tests** — enter an expression, compile, inspect, play, switch views, and export.
7. **Parity tests** — exact endpoints and perceptual intermediate states across 2D, 3D, and ManimGL.
8. **Performance tests** — algebra, planning, interaction, and video rendering measured independently.

## Major risks and decisions

| Decision or risk | Starting position |
| --- | --- |
| Exact algebra library versus custom kernel | Begin with a narrow internal rational-polynomial and certified-real-root kernel; evaluate a library before expanding beyond degree three. |
| General cubic syntax | Use explicit polynomial and root-index syntax rather than guessing a root from a decimal approximation. |
| Candidate mapping | Select candidates using exact algebraic identity plus certified geometric residuals, never list position alone. |
| Paper layout | Use deterministic templates and bounded coordinate frames before attempting automatic layout optimization. |
| Degree explosion | Enforce explicit algebraic-degree, coefficient-size, and planner-complexity limits. |
| Physical realism | Preserve mathematical flat-fold correctness; treat collision and paper thickness as presentation limitations. |
| Shared Euclidean compiler | Share parser and algebra DAG where helpful, but keep construction planners and UI state independent. |

## Recommended implementation order

1. Complete and certify O1–O7, especially O6.
2. Build exact rational/quadratic/cubic algebra and root isolation.
3. Extend expression syntax and constructibility classification.
4. Implement and prove individual construction templates.
5. Compose templates with the deterministic fold planner.
6. Add Origami expression input and synchronized inspection.
7. Complete proofs and educational narrative.
8. Harden multi-renderer parity, performance, cancellation, and release setup.

## Definition of complete

General origami compute is complete when a user can enter any expression within the documented rational, quadratic, and cubic language; receive an exact constructibility result; compile it into a deterministic, proof-linked multi-fold session; inspect every algebraic and crease branch; play it in browser 2D or 3D; and export equivalent JSON and ManimGL video without affecting the independent Euclidean workflow.
