# SVG rendering

The static renderer consumes geometry objects and does not contain arithmetic construction logic. `SvgConstructionCanvas` owns the accessible SVG frame and delegates each object to `renderObject`.

## Visual grammar

Every rendered element receives a stable DOM ID derived from its geometry object ID, a `data-created-by` step reference, and a semantic CSS class based on its role. Inputs, the unit, scaffolding, intermediate lengths, the active construction, proof highlights, and the final result are styled independently.

The canvas accepts a configurable `viewBox`; scene coordinates remain separate from screen size. Unknown geometry kinds are omitted safely. The renderer currently supports points, segments, lines, rays, circles, arcs, labels, and triangles.

## Polynomial scene

`examplePolynomialScene.ts` is the Milestone 3 static example. It contains the given lengths `a`, `b`, and `1`; intermediate segments `x = 3a + b` and `y = a + b`; and a similar-triangle schematic for the result placeholder `r = xy`. The side panel uses the same object and step IDs as the scene.

For a development screenshot, run `npm run dev`, open the URL printed by Vite, and capture the complete construction panel at a desktop viewport of at least 1200 pixels wide.
