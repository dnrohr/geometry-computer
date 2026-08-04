# Interactive Origami UI Roadmap

## Objective

Bring the Origami workspace to the same interactive standard as the Euclidean construction workspace while keeping the two experiences in separate top-level tabs.

The TypeScript origami domain remains authoritative. Browser animation and ManimGL video rendering consume the same versioned render document and must not independently solve folds or choose ambiguous branches.

## Product boundary

The application retains two top-level workspaces:

1. **Euclidean construction** — expression compilation, construction trace, proofs, and compass-and-straightedge playback.
2. **Origami folding** — fold selection or authoring, paper-state inspection, and fold playback.

Switching tabs must preserve the state of both workspaces for the current session. Shared controls may use common components internally, but the workflows should not be merged into one crowded interface.

## Milestone 1 — Origami timeline foundation

Status: completed on the `origami` branch on 2026-08-03. The Origami tab now evaluates canonical render actions at arbitrary document times, interpolates precomputed fold and unfold targets, and provides play, pause, restart, previous-action, next-action, scrubbing, and playback-rate controls. Timeline and control behavior are covered by deterministic tests.

### Tasks

- Add an origami playback state containing current time, duration, playback rate, and playing/paused status.
- Evaluate render actions at arbitrary timeline positions without invoking ManimGL.
- Interpolate flat-fold polygon vertices from source to computed target geometry.
- Support reveal, draw, fade-in, fold, and unfold actions.
- Add play, pause, restart, previous-step, next-step, and scrubber controls.
- Stop playback exactly at action and document boundaries.
- Respect pauses encoded in the render document.
- Add deterministic timeline unit tests, including zero-duration and overlapping actions.

### Acceptance criteria

- Each of the four reference folds can be played, paused, restarted, and scrubbed.
- Scrubbing to the beginning and end exactly matches the domain source and target polygons.
- Fold and unfold actions play in the documented order.
- Playback does not modify the render document or recompute fold geometry.

## Milestone 2 — Interactive fold canvas

Status: completed on the `origami` branch on 2026-08-03. The static diagram is now a reusable timeline-driven SVG canvas with stable framing, front/back materials, deterministic layer order, moving and stationary face styling, timed points, lines, arrows, creases, and labels. Objects support hover, pointer selection, keyboard selection, visible focus, and a semantic selection summary; source, midpoint, target, annotation, and view-box behavior are component-tested.

### Tasks

- Replace the static origami SVG with a timeline-driven canvas component.
- Render front and back paper colors and deterministic layer ordering.
- Keep stationary faces fixed while moving faces interpolate.
- Render creases, source and target points, target lines, arrows, and labels.
- Highlight moving, stationary, selected, and hovered geometry distinctly.
- Add click and keyboard selection for faces, points, creases, and annotations.
- Make view-box fitting stable throughout a fold so the sheet does not jump.
- Add component and visual-state tests for representative timeline positions.

### Acceptance criteria

- The browser preview visually explains what moves and what remains fixed.
- Object selection exposes stable object IDs and semantic roles.
- Layer and front/back presentation agrees with the flat ManimGL result.
- The canvas remains usable on desktop and narrow screens.

## Milestone 3 — Fold trace and instruction panels

Status: completed on the `origami` branch on 2026-08-03. Each reference fold now has a domain-backed physical trace synchronized to exact timeline boundaries, plain-language instructions, operation, branch, assumptions, moving-side, and numeric-tolerance details. Trace hover highlights related canvas objects; selection navigates playback. The object inspector reports identity, role, producing step, face vertices, layer, side, and dependencies. Both workspace trees remain mounted so Origami and Euclidean state survive tab switches.

### Tasks

- Add an origami step list synchronized with playback.
- Show the active fold, crease construction, moving side, source, target, and branch choice.
- Add plain-language instructions for performing each physical fold.
- Display provenance, assumptions, tolerances, and degeneracy information from the domain.
- Add an inspector for face layer, side, vertices, dependencies, and producing step.
- Highlight canvas objects when hovering or selecting a step.
- Preserve the selected step and timeline position when switching workspace tabs.

### Acceptance criteria

- Selecting a trace step moves playback to the corresponding boundary.
- Each reference fold has complete, domain-backed instructions.
- Ambiguous folds identify the selected branch rather than silently hiding it.
- The inspector never derives new geometry independently of the domain result.

## Milestone 4 — Guided fold authoring

Status: completed on the `origami` branch on 2026-08-03. The Origami tab now provides guided controls for point-to-point, line-to-line, parallel-line, through-point, and point-to-line-through-point folds. Moving sides, angle-bisector branches, and real O5 candidates are explicit; source, target, and through-points can be entered precisely or picked from the paper canvas. Accepted requests compile into the canonical render document and reuse playback, inspection, JSON, and MP4 export. Invalid requests preserve the last valid construction, and undo, redo, reset, and example loading are supported.

### Tasks

- Add a nontechnical fold-operation chooser.
- Support point-to-point, line-to-line, parallel, through-point, and point-to-line-through-point operations already available in the domain.
- Add direct selection of source points, target points, lines, and the moving side on the paper.
- Show valid crease candidates when an operation has multiple branches.
- Require explicit branch selection when candidates are ambiguous.
- Explain impossible or degenerate requests without discarding the last valid construction.
- Add undo, redo, reset-paper, and example-loading actions.
- Compile every accepted request into the canonical render document.

### Acceptance criteria

- A user can construct each supported fold without editing JSON or Python.
- Ambiguous and invalid operations have predictable, recoverable behavior.
- Undo and redo restore identical geometry, layers, provenance, and timeline data.
- Authored constructions export through the existing JSON and MP4 paths.

## Milestone 5 — Multi-step paper sessions

Status: completed on the `origami` branch on 2026-08-03. Versioned origami sessions apply each fold to the preceding authoritative flat paper state, preserve face lineage and accumulated creases, and map a global session timeline exactly across fold boundaries. The Origami tab supports appending authored folds, selecting and playing session steps, a separate open-sheet crease-pattern view, a tested three-fold reference, clear recovery from unsupported folds, session reset, and JSON save/load by replaying canonical guided requests.

### Tasks

- Allow a completed flat fold to become the input state for the next fold.
- Maintain stable face lineage across splits, reflections, folds, and unfolds.
- Display the accumulated crease pattern independently of the current folded state.
- Add a session timeline spanning multiple fold documents or steps.
- Define when a fold must be unfolded before another operation.
- Surface unsupported collision and self-intersection cases using the existing policy.
- Add save/load for a complete origami session using a versioned schema.

### Acceptance criteria

- At least one three-fold reference construction plays from beginning to end.
- Scrubbing across fold boundaries restores the exact corresponding paper state.
- Saving and loading a session preserves IDs, layers, branches, and provenance.
- Unsupported physical cases fail clearly without corrupting the session.

## Milestone 6 — Interactive browser 3D preview

Status: completed on the `origami` branch on 2026-08-03. The Origami tab has a persistent precise-2D/interactive-3D switch backed by a dynamically loaded, replaceable Three.js adapter. Browser hinge geometry uses the canonical crease and moving side, rises out of plane, changes front/back material, shares the existing timelines, and settles exactly onto the authoritative flat target. Orbit, zoom, camera presets, layer separation, missing-WebGL fallback, and unsupported multi-face collision fallback are implemented and tested.

### Tasks

- Add a 2D/3D view switch inside the Origami tab; retain 2D as the default precision and crease-pattern view.
- Render the paper as layered front/back materials in a browser WebGL scene using a replaceable adapter boundary.
- Derive every hinge axis from the same canonical crease used by the flat-fold document.
- Rotate only the computed moving faces while stationary faces and the crease remain fixed.
- Synchronize 3D motion with the existing play, pause, restart, step, speed, and scrubber controls.
- Settle each 3D fold exactly onto its authoritative flat target instead of using the rendered 3D result as geometry input.
- Add orbit, zoom, reset-camera, and presentation camera presets without changing construction state.
- Show front/back material changes, layer separation, and crease emphasis throughout motion.
- Respect the existing multi-face collision policy: explain unsupported cases and offer the 2D fallback.
- Detect missing WebGL support and degrade cleanly to the 2D view.
- Keep the browser renderer optional and isolated so it can be replaced without changing the origami domain.
- Add source, midpoint, target, camera, fallback, and browser/Manim hinge-parity tests.

### Acceptance criteria

- Every single-fold reference construction plays and scrubs in both 2D and 3D.
- The 3D hinge is derived from the canonical crease and remains fixed during rotation.
- The 3D start and end states exactly match the authoritative flat source and target geometry.
- Switching between 2D and 3D preserves the current construction, selected step, selected object, and timeline time.
- Unsupported collisions and unavailable WebGL produce an understandable 2D fallback rather than breaking the workspace.
- The browser 3D midpoint is visually consistent with the corresponding ManimGL hinge render within the documented tolerance.

## Milestone 7 — Accessibility, resilience, and parity

Status: completed on the `origami` branch on 2026-08-03. Both workspaces preserve state across an accessible tablist with arrow/Home/End navigation. Origami controls and SVG objects are keyboard-operable and named, reduced-motion playback advances through discrete meaningful states, WebGL and rendering failures leave 2D interaction intact, and responsive, focus, high-contrast, tab-retention, full-workflow, 3D-settlement, and fallback behavior are tested. Usage, limitations, recovery, session schema, and 2D/3D/Manim parity tolerances are documented in `ORIGAMI_UI.md`.

### Tasks

- Add complete keyboard operation for tabs, timeline, step list, authoring tools, and canvas selection.
- Provide accessible names and text alternatives for paper states and fold actions.
- Respect reduced-motion preferences while retaining step navigation.
- Preserve Euclidean and Origami state independently across tab switches.
- Add browser tests covering tab switching and both complete workflows.
- Verify JSON and MP4 failures do not interrupt interactive playback.
- Add responsive and high-contrast visual checks.
- Document browser limitations and recovery behavior.

### Acceptance criteria

- Both workspaces retain their state when switching tabs.
- Core origami construction and playback can be completed without a pointer.
- Reduced-motion mode replaces continuous folding with discrete meaningful states.
- Euclidean expression compilation and step playback remain regression-tested.

## Testing strategy

1. **Timeline unit tests** — interpolation, action boundaries, overlap, pause, fold, and unfold behavior.
2. **Domain contract tests** — browser playback consumes the canonical domain output unchanged.
3. **Component tests** — controls, selection, trace synchronization, tab-state retention, and errors.
4. **Workflow tests** — author a fold, play it, inspect it, export it, and switch tabs without losing state.
5. **Visual tests** — source, midpoint, target, unfolded, layered, narrow-screen, and high-contrast states.
6. **Manim parity tests** — compare key browser and ManimGL flat-fold frames within a perceptual threshold.

Graphics-dependent and browser end-to-end tests remain separate from the ordinary domain suite where practical.

## Recommended implementation order

1. Timeline evaluator and controls.
2. Timeline-driven SVG paper canvas.
3. Synchronized trace and inspector.
4. Guided single-fold authoring.
5. Multi-fold sessions and crease-pattern history.
6. Interactive browser 3D preview with exact flat settlement and graceful fallback.
7. Accessibility, workflow automation, and 2D/3D/Manim parity hardening.

## Definition of complete

The interactive origami workspace is complete when a user can select or author a supported fold, understand the chosen geometric branch, play and scrub the computed motion in precise 2D or interactive 3D, inspect paper state and provenance, build a multi-fold session, and export the same authoritative construction to JSON and ManimGL video—all without losing the independent Euclidean workspace state.

General algebraic expression compilation over the origami-constructible numbers is tracked separately in [ORIGAMI_COMPUTE_ROADMAP.md](ORIGAMI_COMPUTE_ROADMAP.md).
