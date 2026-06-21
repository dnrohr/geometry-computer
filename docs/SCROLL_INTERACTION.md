# Reveal and interaction

Global progress is clamped to `[0,1]`; each reveal action maps its own start/end interval to local progress. Draw actions use SVG dash offset, fades alter opacity, and dim/highlight actions set deterministic render flags. Reduced-motion environments may jump directly to complete state, and the explicit slider always permits instant navigation.

Step hover/selection highlights inputs and outputs. Object hover/selection highlights its creating and consuming steps; selection persists as the inspector target. The expression tree provides a third route into the same provenance graph.
