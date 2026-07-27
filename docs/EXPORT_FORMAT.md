# Export format

JSON exports are versioned and contain `expression`, `simplifiedExpression`, `values`, `viewBox`, `objects`, `steps`, `revealActions`, and `proofs`. Volatile hover, selection, active-step, and panel state are excluded. Geometry records retain provenance and can be passed back to `SvgConstructionCanvas`.

Current SVG export serializes the visible SVG with a complete embedded visual-role stylesheet. Clean SVG export additionally hides scaffold and ghost objects, restores completed result visibility, and appends the algebraic expression summary while preserving the accessible title and description. Tests parse exported JSON back into the SVG renderer and validate both SVG modes.

Origami function script export is a text inspection and replay artifact, not an
executable construction plan. It records the normalized function, sample values,
result, solver readiness, active phase, paper style, and deterministic per-phase
fold method/status lines. Script import recompiles the source and samples through
the origami function compiler, restores recognized paper-style keys and active
phase/progress, and leaves compass-and-straightedge export behavior unchanged.

Origami construction script export is a deterministic inspection artifact. It
does not import or replay yet; instead it lists the normalized function, samples,
result object/value, solver and verification summaries, plan nodes, operations,
phases, length transfers, and verification issues so generated fold programs can
be reviewed outside the browser.
