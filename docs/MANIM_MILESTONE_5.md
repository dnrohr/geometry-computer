# Milestone 5 verification

Milestone 5 turns computed flat-fold documents into a consistent origami video language.

## Presentation behavior

- Front paper uses warm ivory; the reverse side uses muted terracotta.
- Every paper polygon receives its computed layer as Manim z-order.
- Fold actions transform to explicit target vertices, target layer, and target material side.
- Creases remain above paper layers.
- Source and target points, motion arrows, and explanatory labels remain above faces.
- Optional target lines are clipped to the current paper boundary.
- Pre-fold and post-fold pauses are configurable during document generation.
- `unfold` actions return a face to explicit source geometry and material state while retaining the crease.
- Scene bounds include both original and folded geometry, preventing valid overhanging flaps from being cropped.

## Generate the reference documents

```powershell
npm run origami:examples
```

This produces domain-computed documents for:

- Edge-to-edge bisection.
- Corner-to-corner folding.
- Right-angle bisection by matching edges.
- A perpendicular-bisector fold followed by unfolding.

## Verified videos

The four documents were rendered at 640×360, 15 fps and visually inspected at their folded states. The unfolded reference was also inspected after its return animation. Final geometry agrees with the domain's reflected polygons; front/back color and layer order remain consistent.

This is deliberately flat animation. Three-dimensional hinge rotation is Milestone 6 and must settle onto the same target polygons.
