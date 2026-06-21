# Export format

JSON exports are versioned and contain `expression`, `simplifiedExpression`, `values`, `viewBox`, `objects`, `steps`, `revealActions`, and `proofs`. Volatile hover, selection, active-step, and panel state are excluded. Geometry records retain provenance and can be passed back to `SvgConstructionCanvas`.

Current SVG export serializes the visible SVG with an embedded minimal style block. Clean SVG export additionally hides scaffold and ghost objects, preserving the result geometry, labels, accessible title, description, and expression-oriented labels.
