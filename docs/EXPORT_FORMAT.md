# Export format

New JSON exports use render-document version 2 and contain `metadata`, `expression`, `simplifiedExpression`, `values`, `viewBox`, `objects`, `steps`, `revealActions`, and `proofs`. Volatile hover, selection, active-step, and panel state are excluded. Geometry records retain provenance and can be passed back to `SvgConstructionCanvas`. Version 1 Euclidean documents remain readable through deterministic in-memory migration. See [Render document version 2](RENDER_DOCUMENT_V2.md).

Current SVG export serializes the visible SVG with a complete embedded visual-role stylesheet. Clean SVG export additionally hides scaffold and ghost objects, restores completed result visibility, and appends the algebraic expression summary while preserving the accessible title and description. Tests parse exported JSON back into the SVG renderer and validate both SVG modes.
