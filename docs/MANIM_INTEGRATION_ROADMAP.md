# ManimGL Integration Roadmap

## 1. Objective

Add ManimGL as an optional video renderer for both Euclidean constructions and origami computations while retaining the existing React/SVG experience.

The TypeScript domain remains authoritative for geometry, construction choices, provenance, and timing. ManimGL receives a deterministic, versioned render document and is responsible only for presentation and video production.

## 2. Architectural boundary

```text
expression or fold request
        |
        v
TypeScript construction domain
        |
        v
versioned render document
     /             \
    v               v
React/SVG        Python/ManimGL
interactive UI    video export
```

The renderer must not:

- Solve intersections or origami axioms.
- Select among ambiguous geometric solutions.
- Decide which paper face moves during a fold.
- Recalculate proof claims or construction provenance.

This makes SVG and Manim output reproducible views of the same computation.

## 3. Current baseline

The `origami` branch contains an experimental adapter that:

- Reads existing version 1 Euclidean JSON exports.
- Maps SVG coordinates into Manim's centered coordinate system.
- Converts all current Euclidean geometry kinds.
- Maps reveal actions to Manim animations.
- Defines preliminary version 2 `polygon`, `crease`, and `fold` concepts.
- Validates documents without importing ManimGL.
- Includes a flat-fold paper-bisection example.

ManimGL cannot yet render locally because its Python dependencies and ffmpeg are not installed.

## 4. Milestone 1 — Reproducible rendering environment

Status: completed on the `origami` branch on 2026-08-03. Preflight passes and a 640×360, 15 fps H.264 smoke scene was rendered successfully through OpenGL and ffmpeg.

### Work

- Select and document a supported Python version, initially Python 3.11 or 3.12.
- Create a dedicated virtual environment outside the TypeScript dependency tree.
- Install the local checkout at `C:\Users\dnroh\Documents\third_party\manim` in editable mode.
- Install and verify ffmpeg.
- Verify OpenGL support and render a bundled ManimGL example.
- Add a preflight command that reports missing Python packages, ManimGL, ffmpeg, LaTeX, and output-directory access.
- Decide whether LaTeX is required for the initial release or whether Manim `Text` is sufficient.

### Acceptance criteria

- A documented command creates a working environment from a clean machine setup.
- A bundled ManimGL scene renders to MP4.
- The preflight command exits nonzero with actionable errors when a dependency is missing.
- The preflight command succeeds without requiring the web application to run.

## 5. Milestone 2 — Euclidean end-to-end export

Status: completed on the `origami` branch on 2026-08-03. The TypeScript CLI compiles expressions into validated construction documents, and the wrapper renders configurable MP4 output. All four reference scenes below rendered successfully at 640×360 and 15 fps during milestone verification.

### Work

- Add a non-browser command that parses and compiles an expression into a render document.
- Add a wrapper command that invokes validation and ManimGL rendering.
- Support output path, quality, resolution, frame rate, background color, and final-frame hold duration.
- Preserve object IDs, semantic roles, construction steps, and reveal order.
- Group actions that overlap in time so they animate concurrently rather than sequentially.
- Define behavior for zero-duration actions and objects without reveal actions.
- Render labels without requiring a full LaTeX installation; add optional mathematical typesetting later.

### Reference scenes

- `a + b`: segment transfer.
- `a * b`: similar-triangle construction.
- `sqrt(a)`: geometric-mean construction.
- `sqrt(a + b^2)`: nested construction and scaffold handling.

### Acceptance criteria

- Each reference expression produces a valid JSON document and MP4.
- The SVG and video contain the same object IDs, geometry, labels, and semantic colors.
- Reveal ordering agrees with the construction trace.
- Rendering identical input twice produces equivalent geometry and timing.
- Invalid expressions and missing variable values fail before ManimGL starts.

## 6. Milestone 3 — Stable render-document version 2

Status: completed on the `origami` branch on 2026-08-03. New exports use typed version 2 documents, both runtimes validate shared fixtures, legacy version 1 documents migrate automatically in memory, and verified Euclidean and origami fixtures render through ManimGL.

### Work

- Replace provisional dictionaries with explicit TypeScript types and runtime validation.
- Separate persistent scene objects from timed animation actions.
- Define `polygon` and `crease` geometry formally.
- Define fold actions with source face IDs, crease IDs, moving-side selection, target vertices, and layer changes.
- Add document metadata for title, narration text, aspect ratio, theme, duration, and generator version.
- Document version compatibility and migration rules.
- Add fixture-based contract tests shared between TypeScript and Python.

### Acceptance criteria

- TypeScript rejects malformed render documents at compile time where possible.
- Both TypeScript and Python validators accept every canonical fixture and reject every invalid fixture.
- Version 1 Euclidean exports continue to render or have a documented migration command.
- Unknown future fields are handled according to a documented compatibility policy.

## 7. Milestone 4 — Origami computation core

Status: completed on the `origami` branch on 2026-08-03. The deterministic TypeScript domain implements reflection, polygon splitting and clipping, moving-side selection, flat face/layer updates, branch-aware fold solvers, and computed v2 document generation. The bisection reference is now generated and rendered from domain results rather than stored target vertices.

### Domain model

- Paper boundary, faces, edges, and vertices.
- Stable face IDs and front/back material properties.
- Creases represented as exact lines plus clipped visible segments.
- Layer order before and after each fold.
- Moving and stationary face sets.
- Fold provenance, assumptions, degeneracy information, and proof references.

### Geometry primitives

- Reflect a point across a line.
- Reflect a polygon across a line.
- Split a polygon by a crease.
- Clip a crease to the paper boundary.
- Determine the moving half-plane.
- Preserve consistent polygon winding.
- Detect degenerate, coincident, or impossible folds.

### Initial fold operations

Implement these in increasing order of ambiguity:

1. Fold one point onto another; the crease is the perpendicular bisector.
2. Fold one line onto another; the crease is an angle bisector with an explicit branch choice.
3. Fold through a specified point.
4. Fold one point onto a line through a specified point.
5. Expand toward the remaining Huzita–Hatori axioms after the branch and degeneracy model is proven.

### Acceptance criteria

- Every operation has numeric, symbolic-description, branch-selection, and degeneracy tests.
- Post-fold target points lie on their required destinations within a documented tolerance.
- Moving faces are exact reflections across the crease in the flat-fold result.
- Computation is deterministic and independent of ManimGL.
- The paper-bisection example is generated by the domain instead of stored as hand-authored target vertices.

## 8. Milestone 5 — Flat origami video rendering

Status: completed on the `origami` branch on 2026-08-03. The renderer applies distinct front/back materials and explicit layer order, supports reference points, target lines, arrows, labels, configurable pauses, and reversible unfold actions. All four reference scenes are generated from domain geometry and rendered successfully.

### Work

- Render faces with distinct front and back colors.
- Animate computed source polygons into computed target polygons.
- Preserve stable face identity through splits and folds.
- Render creases, reference points, target lines, arrows, and explanatory labels.
- Apply layer order consistently after each fold.
- Add configurable pauses before the fold, at maximum motion, and after settling.
- Support unfolding when the construction narrative requires the crease to remain on the original sheet.

### Reference scenes

- Bisect a square sheet by folding one edge onto the opposite edge.
- Fold one corner onto another.
- Construct an angle bisector by folding one edge onto another.
- Origami construction corresponding to a Euclidean perpendicular bisector.

### Acceptance criteria

- All reference scenes render without hand-authored target polygons.
- The final flat geometry matches the domain result.
- Front/back colors and layers remain visually consistent.
- Fold animations do not introduce gaps or self-crossings not present in the computed geometry.

## 9. Milestone 6 — Three-dimensional hinge animation

Status: completed on the `origami` branch on 2026-08-03. ManimGL derives an arbitrary 3D hinge axis from each computed crease, rotates moving faces by 180 degrees, changes front/back material at the midpoint, and interpolates directly onto the exact flat target. Camera, shading, margin, and collision-policy presets are configurable; all four reference scenes, including fold–unfold, rendered successfully.

This milestone improves presentation without changing the flat-fold computation contract.

### Work

- Rotate moving faces around the crease as a 3D hinge.
- Derive the hinge axis from the same crease used by the flat-fold result.
- Split faces where necessary so only the selected side rotates.
- Add camera angle and lighting presets that keep construction geometry readable.
- Handle front/back material changes during rotation.
- Settle the rotating faces exactly onto their computed flat targets.
- Identify limitations around multi-layer collision and self-intersection.

### Acceptance criteria

- The start and end states match the flat-fold source and target geometry.
- The crease remains fixed throughout the animation.
- A 180-degree fold ends without visible drift from the exact target.
- Unsupported collision cases fail clearly or fall back to flat animation.

## 10. Milestone 7 — Application integration

Status: completed on the `origami` branch on 2026-08-03. The React application has an optional MP4 panel backed by a localhost-only, allowlisted rendering service. It reports progress, supports cancellation and download, exposes exact successful output paths, cleans failed or cancelled artifacts, serializes GPU work, and leaves SVG/JSON functionality unaffected when unavailable.

### Work

- Add a local export command suitable for development and automation.
- Decide whether the web UI starts a local rendering service or downloads JSON for an external renderer.
- Add video-export controls only after the trust boundary and deployment model are decided.
- Report progress by compilation, validation, scene construction, and encoding phase.
- Surface logs and dependency failures in readable language.
- Allow cancellation without leaving incomplete output files presented as successful renders.
- Keep video rendering optional so the web application retains its lightweight setup.

### Acceptance criteria

- A user can export a selected Euclidean or origami construction without editing Python files.
- Rendering failure does not interrupt interactive SVG use.
- Successful export reports the exact output path and render settings.
- Cancellation and retries behave predictably.

## 11. Milestone 8 — Quality, performance, and release readiness

Status: completed on the `origami` branch on 2026-08-03. A separate graphics suite renders Euclidean, flat-fold, and hinge references through paths containing spaces and Unicode, checks perceptual golden signatures, records object counts and render times against 60-second per-scene budgets, and audits temporary cleanup. Compatible tool versions, attribution requirements, recovery guidance, and a clean-Windows checklist are recorded.

### Work

- Add golden-frame comparisons for representative scenes.
- Add duration and object-count performance benchmarks.
- Test paths containing spaces and non-ASCII characters.
- Verify Windows process invocation and cleanup.
- Pin or record the compatible ManimGL revision.
- Record licensing and attribution requirements for distributed output or tooling.
- Document debugging, cache cleanup, and recovery from interrupted renders.

### Acceptance criteria

- Golden frames stay within an agreed visual-difference threshold.
- A standard reference scene renders within an agreed time budget.
- No temporary files remain after successful, failed, or cancelled renders.
- The compatible Python, ManimGL, ffmpeg, and optional LaTeX versions are recorded.
- A release checklist can be completed on a clean Windows environment.

## 12. Testing strategy

Use four layers of tests:

1. **Domain unit tests:** exact Euclidean and origami calculations without rendering.
2. **Contract tests:** TypeScript and Python agree on accepted render documents.
3. **Adapter tests:** geometry kinds, coordinates, roles, and actions map to expected Manim objects and animations.
4. **Visual tests:** selected frames and final videos are compared against approved references.

ManimGL and ffmpeg should not be required for ordinary domain tests. Tests that require graphics dependencies should be clearly marked and runnable as a separate integration suite.

## 13. Risks and decisions to resolve

| Decision or risk               | Recommended starting position                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------------------ |
| ManimGL versus Manim Community | Use the supplied ManimGL checkout; isolate the adapter so it can be replaced.                    |
| Python version compatibility   | Pin Python 3.11 or 3.12 after the first successful environment test.                             |
| LaTeX dependency               | Keep it optional initially; use plain text labels by default.                                    |
| Flat versus 3D folds           | Make flat folds mathematically complete before adding hinge animation.                           |
| Layer and collision complexity | Support deterministic flat layer order first; document unsupported physical collisions.          |
| UI process execution           | Begin with a local command; design the security and deployment model before UI invocation.       |
| Schema ownership               | Keep the canonical types and computation in TypeScript, with a Python validator at the boundary. |
| Rendering reproducibility      | Pin the ManimGL revision and expose all video settings explicitly.                               |

## 14. Recommended implementation order

1. Complete Milestone 1 and render a bundled ManimGL example.
2. Render `a + b` from an actual Geometry Computer export.
3. Stabilize the version 2 contract and cross-language fixtures.
4. Implement point reflection, polygon splitting, and point-to-point folding.
5. Generate and render the paper-bisection example from the TypeScript domain.
6. Expand origami axioms and flat layer handling.
7. Add 3D hinge presentation.
8. Integrate export controls only after the command-line workflow is reliable.

## 15. Definition of integration complete

The integration is complete when:

- Euclidean and origami computations share one versioned render contract.
- SVG and ManimGL output are generated from the same authoritative geometry and timeline.
- At least four Euclidean and four origami reference scenes render deterministically.
- Origami target geometry is computed, not authored inside the renderer.
- Flat folds are mathematically correct and 3D folds settle onto the exact flat result.
- Rendering is optional, documented, testable, and failure-isolated from the web application.

## 16. Follow-on interactive UI work

The rendering integration is complete, but interactive origami playback and authoring are tracked separately in [ORIGAMI_INTERACTIVE_UI_ROADMAP.md](ORIGAMI_INTERACTIVE_UI_ROADMAP.md). That roadmap preserves independent Euclidean and Origami tabs while bringing timeline playback, inspection, authoring, and multi-fold sessions to the Origami workspace.
