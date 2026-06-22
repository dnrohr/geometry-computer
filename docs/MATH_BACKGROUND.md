# Mathematical background

A marked unit segment is essential: multiplication and division of lengths are defined by ratios to that unit. Addition and subtraction concatenate directed segments. Parallel-line similar triangles construct products and quotients. Squaring preserves its semantic operation even though it shares multiplication machinery. For `sqrt(x)`, split a semicircle diameter into lengths `1` and `x`; the perpendicular altitude at the join has height `h` with `h² = x`.

The app separates symbolic construction from numeric rendering. The AST and operation trace describe exact field operations; sample values only determine displayed segment lengths and verify the expected result. Negative directed results are valid, while division by zero and square roots of negative values are rejected before geometry is emitted.

Constructing `sqrt(x)` as a length requires a reference length `u`: the semicircle construction produces the geometric mean `sqrt(xu)`, which is interpreted as `sqrt(x)` only after choosing `u = 1`. This reference is mathematically necessary, not merely a layout convention. Straightedge-and-compass constructions from a single input length are scale-equivariant, whereas the map `x -> sqrt(x)` is not. Without a fixed unit, the meaningful unit-free operation is a geometric mean such as `sqrt(ab)` from two supplied lengths.
