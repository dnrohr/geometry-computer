# Reveal and interaction

The construction canvas is sticky while the macro and primitive step column scrolls. Page position is converted to global progress in `[0,1]`, selects the corresponding active step, and drives every object's reveal interval. Draw actions use SVG dash offset, fades alter opacity, and dim/highlight actions set deterministic render flags. Reduced-motion environments jump directly to complete state, and the explicit slider and step buttons provide instant alternatives.

Step hover/selection highlights inputs and outputs. Object hover/selection highlights its creating and consuming steps; selection persists as the inspector target. Expression-tree selection highlights every matching object and all producing/consuming steps through the same provenance graph. Dashed scaffold geometry fades into place without the large dash-offset drawing animation; progressive drawing is reserved for solid construction and result segments.
