# ManimGL release checklist

## Recorded environment

The verified Windows environment is recorded in `tools/manim_renderer/environment-lock.json`: Python 3.12.10, ManimGL 1.7.2 at revision `08c5586e10db69169180f307f293122d594a581b`, and ffmpeg 8.1.2. LaTeX is optional and was not installed; ordinary labels use ManimGL `Text`.

## Clean-machine verification

1. Clone Geometry Computer and check out `origami`.
2. Clone ManimGL at the recorded revision into the location configured by `tools/manim_renderer/setup.ps1`.
3. Run `powershell -ExecutionPolicy Bypass -File tools/manim_renderer/setup.ps1`.
4. Run `npm ci`, `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build`.
5. Run `npm run manim:preflight` and `npm run manim:smoke`.
6. Run the separate graphics suite with `npm run manim:quality`.
7. Start `npm run manim:service`, export one MP4, cancel a second export, and confirm `media/service/temp` contains no abandoned files.

Golden signatures may be deliberately updated with `.venv-manim\\Scripts\\python.exe tools/manim_renderer/quality_suite.py --approve` only after reviewing all three videos. The checks use a 256-bit difference hash and mean color with tolerances for minor GPU and codec differences.

## Recovery and cleanup

- Stop an interrupted service with Ctrl+C before deleting abandoned contents inside `media/service/temp`.
- Completed downloads live in `media/service`; process-local jobs are not reported as complete after a restart.
- Remove ManimGL caches only when no render process is running.
- Re-run preflight after Python, graphics-driver, ManimGL, or ffmpeg changes.
- If OpenGL creation fails, update the graphics driver and repeat the smoke render before diagnosing scene code.

## Licensing and attribution

- ManimGL is MIT-licensed. Preserve its copyright and license notice when redistributing its source or bundled tooling.
- Generated videos are not automatically covered by ManimGL's license, but authors remain responsible for embedded fonts, images, audio, and other assets.
- ffmpeg licensing depends on the exact build and enabled codecs. Review that build's license and notices before redistribution; this setup installs ffmpeg separately.
- Do not redistribute third-party fonts or media unless their licenses permit it.
