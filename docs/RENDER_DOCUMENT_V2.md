# Render document version 2

Version 2 is the shared, renderer-independent boundary between Geometry Computer domain code and presentation adapters.

## Ownership

Canonical types live in `src/domain/render/types.ts`. The TypeScript compiler computes all geometry and emits the document. SVG and ManimGL consume it; renderers do not solve constructions or choose origami branches.

Runtime validators live on both sides of the language boundary:

- TypeScript validates application exports and imported documents.
- Python validates before importing geometry into ManimGL.
- Canonical valid, invalid, Euclidean, origami, and legacy fixtures are shared from `tools/manim_renderer/fixtures`.

## Required document fields

- `version`: exactly `2` for new documents.
- `metadata`: schema identity, generator name/version, title, optional narration, aspect ratio, theme, and duration.
- `expression` and `simplifiedExpression`: source and display descriptions.
- `values`: finite supplied numeric values.
- `viewBox`: four finite numbers with positive dimensions.
- `objects`: geometry plus stable identity and provenance.
- `steps`: semantic construction steps.
- `revealActions`: deterministic animation timeline.
- `proofs`: optional construction proofs.

Euclidean objects use the existing point, segment, line, ray, circle, arc, label, and triangle kinds. Origami adds polygon faces, crease segments, and motion arrows.

Fold actions require:

- The moving face's `objectId`.
- A valid `creaseObjectId`.
- An explicit `movingSide` branch.
- At least three finite `targetPoints`.
- An optional target layer.
- An optional target front/back material side.

`unfold` actions use the same resolved-target contract and return a face to explicit vertices, layer, and material state.

Target points are domain output, not renderer instructions for solving a fold.

## Compatibility policy

- Version 2 readers accept unknown extra fields so additive metadata can be introduced safely.
- Required fields, known geometry, provenance, timing, and references remain strictly validated.
- Unsupported major versions are rejected.
- Version 1 Euclidean documents remain accepted. They are migrated in memory by adding deterministic metadata; geometry and reveal timing are unchanged.
- New exports always use version 2.

## Migration API

TypeScript callers use `migrateRenderDocument`. Python's `load_document` performs the same migration automatically. A migrated document uses its view box for aspect-ratio metadata, its latest action end for duration, and standard generator/theme defaults.

## Validation commands

```powershell
npm test -- --run src/domain/render/validateRenderDocument.test.ts
python -m unittest discover tools/manim_renderer -p "test_*.py"
```
