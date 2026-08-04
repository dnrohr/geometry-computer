# Origami compute release readiness

## Supported release path

On a clean Windows checkout:

```powershell
git switch origami
npm ci
powershell -ExecutionPolicy Bypass -File tools\manim_renderer\setup.ps1 -ManimPath "C:\Users\dnroh\Documents\third_party\manim"
npm test
npm run build
npm run dev
```

Open the local URL, select **Origami folding**, leave `cbrt(2)` in the general-compute panel, and select **Compile origami expression**. The exact result, O6 branch, one-fold session, 2D/3D playback, canonical JSON export, and complete-session MP4 controls should be available.

The locked renderer environment is recorded in `tools/manim_renderer/environment-lock.json`. ManimGL is used from the separately cloned repository and retains its own license; it is not vendored or relicensed by Geometry Computer. Python and npm dependencies retain the licenses declared by their upstream packages. Generated videos and user construction documents are outputs, not bundled third-party source.

## Budgets and parity

- The nine-expression exact/planning reference suite has a 750 ms automated interactive budget on the development test host.
- Draft quality uses 640×360 at 15 fps; standard uses 1280×720 at 30 fps; high uses 1920×1080 at 30 fps.
- Quality-suite reference renders have a 60-second per-case budget.
- Browser 2D, browser 3D, flat ManimGL, and hinge ManimGL consume the same branch-resolved render documents. Automated parity checks assert that every session crease equals its selected template candidate and that selected candidate provenance survives the renderer boundary.

The complete-session rendering service prefixes every object, step, action, and proof ID per fold and offsets action timing. This prevents collisions while producing one canonical combined render document. Cancellation terminates the child process, deletes partial output, removes the temporary JSON document, and releases the render lock.

## Accessibility and platform checks

General-compute controls use programmatic labels and native keyboard controls, compilation failures are alerts, progress is announced through the existing live region, and selected/origami-only states do not rely solely on text. Existing responsive, reduced-motion, forced-colors, and focus styles apply to the new panel. Unicode and spaces in input/output paths are covered by renderer tests.

## Known limits

- Cubic coefficients must evaluate to rationals.
- The current fold planner expands exponent zero and exponent two; analysis supports other integer powers but reports a planner limit.
- A template rescales until its minimum practical scale, then reports a bounded-layout error.
- Mathematical folds assume ideal zero-thickness paper; physical collision and material deformation are presentation limitations.
