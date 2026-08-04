# ManimGL renderer

For the phased implementation plan, see [ManimGL Integration Roadmap](MANIM_INTEGRATION_ROADMAP.md).
For the verified Windows environment, see [ManimGL environment setup](MANIM_SETUP.md).
For the Euclidean pipeline acceptance record, see [Milestone 2 verification](MANIM_MILESTONE_2.md).
The cross-language contract is documented in [Render document version 2](RENDER_DOCUMENT_V2.md).
Flat origami presentation is recorded in [Milestone 5 verification](MANIM_MILESTONE_5.md).
Three-dimensional hinge presentation is recorded in [Milestone 6 verification](MANIM_MILESTONE_6.md).
Browser integration and its trust boundary are documented in [Local video rendering service](MANIM_SERVICE.md).

The renderer in `tools/manim_renderer` consumes the same version 2 render document as the SVG canvas. Version 2 includes the additions needed for flat origami: `polygon` paper faces, `crease` lines, and a `fold` reveal action whose `targetPoints` are computed by the domain layer. Legacy version 1 Euclidean exports are migrated in memory.

This boundary is intentional. Euclidean construction and origami axioms belong in TypeScript domain code; ManimGL only turns resolved geometry and timing into video. In particular, the renderer does not solve intersections or decide which side of a crease moves.

## Validate without graphics dependencies

```powershell
python tools/manim_renderer/render.py tools/manim_renderer/fixtures/valid_origami_v2.json --validate
python -m unittest discover tools/manim_renderer -p "test_*.py"
```

## Render with the local checkout

The checkout at `C:\Users\dnroh\Documents\third_party\manim` is ManimGL. It requires its Python packages, an OpenGL-capable environment, and ffmpeg. Once those are installed:

```powershell
$env:MANIMGL_PATH = "C:\Users\dnroh\Documents\third_party\manim"
python tools/manim_renderer/render.py tools/manim_renderer/fixtures/valid_origami_v2.json
```

## Render a Euclidean expression

After completing the environment setup, compile and render directly from the TypeScript construction domain:

```powershell
npm run construction:render -- -Expression "a + b" -Values "a=3,b=2" -VideoPath "media\manim\addition.mp4"
```

Optional parameters include `-Resolution`, `-Fps`, `-Background`, `-FinalHold`, `-JsonPath`, and `-Simplified`. The command compiles the expression, writes JSON, validates the render document, and invokes ManimGL. Invalid expressions and missing values fail before rendering starts.

The adapter maps the SVG-style view box into Manim's centered coordinate system, flips the vertical axis, preserves semantic role colors, converts all current geometry kinds, and maps reveal actions to Manim animations.

To generate a bisection fold from the TypeScript origami domain rather than fixture geometry:

```powershell
npm run origami:export -- --paper "10,6" --source "0,3" --target "10,3" --moving-side left --output media\constructions\origami-computed.json
.\.venv-manim\Scripts\python.exe tools\manim_renderer\render.py media\constructions\origami-computed.json --output media\manim\origami-computed.mp4
```

## Origami model direction

Flat folds should be compiled into explicit pre-fold and post-fold face polygons. A fold action references one face and supplies its target polygon; the crease is a separate object so it can remain visible. Later support for layered paper should add stable face IDs, layer order, and one fold action per moving face without changing the renderer's geometric responsibility.

For physically convincing 3D folds, replace the polygon `Transform` with a hinge rotation around the crease. That is a presentation upgrade; the flat-fold contract remains useful for exact origami computation and deterministic tests.
