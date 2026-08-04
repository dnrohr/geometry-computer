param(
    [ValidateSet("flat", "hinge")]
    [string]$FoldMode = "hinge",
    [string]$Resolution = "1280x720",
    [int]$Fps = 30,
    [string]$OutputDirectory = "media\manim",
    [ValidateSet("flat", "error")]
    [string]$CollisionPolicy = "flat"
)

$ErrorActionPreference = "Stop"

function Invoke-Checked {
    param([string]$Executable, [string[]]$Arguments)
    & $Executable @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$Executable failed with exit code $LASTEXITCODE"
    }
}

Invoke-Checked ".\node_modules\.bin\tsx.cmd" @("src/cli/exportOrigamiExamples.ts")
foreach ($name in @("edge-bisection", "corner-to-corner", "angle-bisector", "perpendicular-bisector")) {
    Invoke-Checked ".\.venv-manim\Scripts\python.exe" @(
        "tools/manim_renderer/render.py",
        "media/constructions/origami-examples/$name.json",
        "--output", "$OutputDirectory/origami-$name-$FoldMode.mp4",
        "--resolution", $Resolution,
        "--fps", $Fps.ToString(),
        "--fold-mode", $FoldMode,
        "--collision-policy", $CollisionPolicy
    )
}
