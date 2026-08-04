# Milestone 6 verification

Milestone 6 adds optional three-dimensional presentation without changing flat-fold computation.

## Hinge behavior

- The hinge axis is the rendered crease's start-to-end vector.
- The moving face rotates 180 degrees around that axis.
- Material switches from front to back after the face passes edge-on.
- A final six percent of animation time interpolates from the rotated result to the domain's explicit target, eliminating numerical drift without replaying planar motion.
- Unfolding uses the same hinge and exact-target logic in reverse state order.
- The computed crease remains fixed.
- Paper shading provides modest directional lighting while retaining semantic material colors.

## Camera preset

Hinge mode defaults to an angled camera with additional scene margin so raised or overhanging faces remain visible. `--camera-theta`, `--camera-phi`, and `--camera-scale` override the preset.

## Collision policy

The renderer does not claim to simulate paper collision. A single moving face uses hinge animation. Simultaneous multi-face folds are conservatively classified as requiring collision handling:

- `--collision-policy flat` falls back to the exact flat transform with a warning.
- `--collision-policy error` stops with a readable unsupported-collision error.

This keeps unsupported physical cases explicit and preserves a deterministic presentation fallback.

## Render the reference suite

```powershell
npm run origami:render:hinge
```

The suite includes edge bisection, corner-to-corner, angle bisection, and perpendicular-bisector fold–unfold scenes. Verification inspected raised, edge-on, folded, unfolding, and final frames. The final states agree with the same target polygons used by flat rendering.
