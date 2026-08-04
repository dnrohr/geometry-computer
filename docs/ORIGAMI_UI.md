# Interactive origami workspace

The Origami tab is independent from the Euclidean workspace. Switching tabs preserves the current example, authored fold, selected object, trace phase, timeline time, session, and 2D/3D view for the current page session.

## Views

- **Precise 2D** is the default view for selecting objects, inspecting layers and provenance, choosing points on the paper, and reading the crease pattern.
- **Interactive 3D** uses WebGL and Three.js through a replaceable adapter. It derives the hinge from the canonical crease, raises moving faces out of plane, changes paper material, and settles exactly onto the domain-computed flat target. Drag to orbit and scroll to zoom; presentation, top, side, and reset camera controls do not alter construction state.

If WebGL is unavailable or a fold contains multiple simultaneously moving faces requiring unsupported collision handling, the 3D panel explains the limitation and directs the user to the exact 2D view. The domain construction, timeline, JSON, and MP4 export remain usable.

The 3D preview is explanatory rather than a physical simulation. It does not model paper thickness, elasticity, or collisions. ManimGL retains its existing flat-fallback collision policy for final video export.

## Keyboard and motion

- Use Tab and Shift+Tab to reach all controls and selectable SVG objects.
- Use Left/Right Arrow, Home, or End on the workspace tabs.
- Use Enter or Space to select a focused paper object.
- Previous/Next controls move to exact action or fold boundaries.
- With reduced motion enabled, Play advances discretely to the next meaningful boundary instead of starting continuous motion.

## Session files

Session JSON uses schema `geometry-computer/origami-session` version 1. It stores canonical guided requests and reconstructs every paper state on load rather than trusting serialized target polygons. Invalid or unsupported session data leaves the current workspace unchanged.

## Parity and tolerances

Browser 2D, browser 3D, and ManimGL consume the same crease, moving side, target vertices, and action timing. The tested 3D contract requires crease-axis points to remain within `1e-7`, out-of-plane midpoint motion to be nonzero, and final 3D settlement to equal the canonical flat target exactly. Minor lighting, camera, antialiasing, and rasterization differences are presentation-only.
