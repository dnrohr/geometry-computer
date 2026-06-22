# SVG rendering

The static renderer consumes geometry objects and does not contain arithmetic construction logic. `SvgConstructionCanvas` owns the accessible SVG frame and delegates each object to `renderObject`.

## Visual grammar

Every rendered element receives a stable DOM ID derived from its geometry object ID, a `data-created-by` step reference, and a semantic CSS class based on its role. Inputs, the unit, scaffolding, intermediate lengths, the active construction, proof highlights, and the final result are styled independently.

The canvas accepts a configurable `viewBox`; scene coordinates remain separate from screen size. Unknown geometry kinds are omitted safely. The renderer currently supports points, segments, lines, rays, circles, arcs, labels, and triangles.

Compilation finishes by retaining only the root geometric construction. Recursive arithmetic is embedded directly into that figure: additive input lengths are partitioned into labeled subsegments, repeated multiplication becomes repeated equal subsegments, and construction points mark each boundary. For a product, these annotations live on the factor sides of the final similar-triangle construction; the product is highlighted on the constructed side itself rather than copied to a detached result segment. The renderer measures the annotated figure and derives a padded `viewBox` from its final bounds.

Squares label both factor sides directly and use a superscript result label such as `a²`. Square-root figures label the diameter as the unit followed by the recursively partitioned radicand, while the constructed altitude carries a radical label such as `√a` or `√(a + b)`.

When a square occurs inside a larger annotated length, its similar-triangle scaffold is attached directly to the `b²` subsegment and shares that segment as its result. For example, `√(a + b²)` combines the nested square scaffold with the outer semicircle rather than rendering either operation as a detached diagram.

## Polynomial scene

`examplePolynomialScene.ts` is the Milestone 3 static example. It contains the given lengths `a`, `b`, and `1`; intermediate segments `x = 3a + b` and `y = a + b`; and a similar-triangle schematic for the result placeholder `r = xy`. The side panel uses the same object and step IDs as the scene.

For a development screenshot, run `npm run dev`, open the URL printed by Vite, and capture the complete construction panel at a desktop viewport of at least 1200 pixels wide.
