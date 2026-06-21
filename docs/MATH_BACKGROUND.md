# Mathematical background

A marked unit segment is essential: multiplication and division of lengths are defined by ratios to that unit. Addition and subtraction concatenate directed segments. Parallel-line similar triangles construct products and quotients. Squaring preserves its semantic operation even though it shares multiplication machinery. For `sqrt(x)`, split a semicircle diameter into lengths `1` and `x`; the perpendicular altitude at the join has height `h` with `h² = x`.

The app separates symbolic construction from numeric rendering. The AST and operation trace describe exact field operations; sample values only determine displayed segment lengths and verify the expected result. Negative directed results are valid, while division by zero and square roots of negative values are rejected before geometry is emitted.
