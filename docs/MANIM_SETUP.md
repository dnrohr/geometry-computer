# ManimGL environment setup

For pinned versions, graphics regression checks, cleanup guidance, and clean-machine release verification, see [MANIM_RELEASE_CHECKLIST.md](MANIM_RELEASE_CHECKLIST.md).

The integration is verified against:

- Python 3.12.10
- ManimGL 1.7.2 from local revision `08c5586e10db69169180f307f293122d594a581b`
- ffmpeg 8.1.2
- Windows 64-bit

Python 3.14 is not used because native ManimGL dependencies do not yet have the same compatibility coverage. LaTeX is optional for the initial integration; plain `Text` labels render without it.

## One-time prerequisites

Install Python 3.12 and ffmpeg if they are not already available:

```powershell
winget install --id Python.Python.3.12 --exact --scope user
winget install --id Gyan.FFmpeg --exact --scope user
```

Open a new terminal after installing ffmpeg so the updated path is visible.

## Create the isolated environment

From the Geometry Computer repository:

```powershell
powershell -ExecutionPolicy Bypass -File tools\manim_renderer\setup.ps1
```

The script creates `.venv-manim`, installs the checkout's complete requirements, installs ManimGL from the local checkout in editable mode, and runs preflight checks. Installing `requirements.txt` explicitly is necessary because the current editable package metadata does not include every imported package.

The checkout can be overridden:

```powershell
powershell -ExecutionPolicy Bypass -File tools\manim_renderer\setup.ps1 -ManimPath D:\source\manim
```

## Verify dependencies

```powershell
npm run manim:preflight
```

LaTeX is reported as an optional warning. To make it mandatory:

```powershell
.\.venv-manim\Scripts\python.exe tools\manim_renderer\preflight.py --require-latex
```

## Verify OpenGL and video encoding

```powershell
npm run manim:smoke
```

This renders a short 480p MP4 into `media\smoke`. Passing preflight proves package and encoder discovery; passing the smoke render verifies that ManimGL can create an OpenGL context and encode video on the current display and graphics driver.

## Troubleshooting

- If `ffmpeg` was just installed, open a new terminal or restart Codex so it inherits the updated path.
- Run ManimGL in a signed-in desktop session with an available display; Windows OpenGL rendering is not expected to work in a display-less service session.
- Delete and recreate `.venv-manim` if its Python interpreter was moved or upgraded.
- LaTeX failures do not affect the smoke scene or plain-text labels. Install MiKTeX before enabling `Tex` labels.
