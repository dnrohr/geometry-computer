# Origami computation domain

The origami domain computes flat-fold geometry independently of SVG, ManimGL, and React. It uses finite two-dimensional coordinates with a documented tolerance of `1e-9`; presentation adapters receive resolved faces, creases, branches, and target polygons.

## Geometry model

- Oriented lines retain a point and unit direction. The geometric left half-plane has positive signed distance.
- Paper is a collection of stable-ID polygon faces with layer and front/back state.
- Creases are infinite during computation and clipped to the paper for rendering.
- Polygon winding is normalized after splitting and reflection.
- A flat fold splits every affected face, reflects only the selected side, flips its visible side, and assigns it above existing layers.

## Implemented fold constraints

- Point onto point: perpendicular-bisector crease.
- Line onto line: explicit internal or external angle-bisector branch; parallel lines use their midway parallel crease.
- Crease through a specified point and direction.
- Point onto line through a specified point (Huzita–Hatori O5): zero, one, or two real solutions derived from a line-circle intersection.

Coincident points or lines, zero directions, creases outside the paper, empty moving sides, invalid paper, and constraints with no real solution produce stable error codes.

Solver results retain a symbolic description, assumptions, the chosen branch where applicable, and every real crease. This provenance can be attached to later instructional and proof interfaces.

## Generated bisection example

```powershell
npm run origami:export -- --paper "10,6" --source "0,3" --target "10,3" --moving-side left --output media\constructions\origami-computed.json
```

The command computes the perpendicular bisector, splits the paper, reflects the moving face, assigns layers, clips the visible crease, emits a validated render-document v2 file, and does not contain target vertices in CLI code.

## Current boundary

This milestone models ideal flat folds. It does not simulate material thickness, collision, self-intersection, or continuous 3D motion. Those concerns belong to later rendering and physical-model milestones.
