# Milestone 2 verification

Milestone 2 connects the existing TypeScript Euclidean compiler to ManimGL without duplicating construction mathematics.

## Pipeline

```text
CLI expression and values
  → TypeScript parser
  → construction compiler
  → version 1 JSON export
  → Python validation
  → ManimGL scene adapter
  → ffmpeg MP4
```

Run the complete pipeline with:

```powershell
npm run construction:render -- -Expression "a + b" -Values "a=3,b=2" -VideoPath "media\manim\addition.mp4"
```

Invalid syntax, missing variables, impossible real square roots, unsupported powers, and division by zero fail during TypeScript compilation before ManimGL is loaded.

## Verified reference scenes

| Expression      | Values    | Objects | Result   |
| --------------- | --------- | ------: | -------- |
| `a + b`         | `a=3,b=2` |       9 | Rendered |
| `a * b`         | `a=3,b=2` |      19 | Rendered |
| `sqrt(a)`       | `a=4`     |      13 | Rendered |
| `sqrt(a + b^2)` | `a=3,b=2` |      28 | Rendered |

The final frames were visually inspected for labels, construction geometry, semantic colors, and framing. Each render uses the same object geometry and reveal actions as the SVG export. Manim mobjects retain their Geometry Computer object ID as adapter metadata.

## Supported settings

- MP4 destination and matching intermediate JSON destination.
- Resolution and frame rate.
- Background color.
- Final-frame hold duration.
- Optional simplified-expression metadata.

Objects without reveal actions are present from the beginning. Zero-duration actions receive a minimal visible duration. Each object's actions form a sequential timeline, while independent object timelines are submitted in one Manim play call; overlapping intervals therefore animate concurrently.

## Known presentation limits

- Mathematical labels use Manim `Text`, so Unicode layout may differ slightly from browser SVG text.
- LaTeX labels remain optional and are not enabled.
- Video output is a local command rather than a web UI action. UI integration belongs to Milestone 7.
