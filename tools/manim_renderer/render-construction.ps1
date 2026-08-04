param(
    [Parameter(Mandatory = $true)]
    [string]$Expression,
    [string]$Values = "",
    [string]$VideoPath = "media\manim\construction.mp4",
    [string]$JsonPath = "",
    [string]$Resolution = "1280x720",
    [int]$Fps = 30,
    [string]$Background = "#1f2329",
    [double]$FinalHold = 0.75,
    [string]$Simplified = ""
)

$ErrorActionPreference = "Stop"

function Invoke-Checked {
    param([string]$Executable, [string[]]$Arguments)
    & $Executable @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$Executable failed with exit code $LASTEXITCODE"
    }
}

if (-not $JsonPath) {
    $name = [IO.Path]::GetFileNameWithoutExtension($VideoPath)
    $JsonPath = Join-Path "media\constructions" "$name.json"
}

$exportArguments = @(
    "src/cli/exportConstruction.ts",
    "--expression", $Expression,
    "--values", $Values,
    "--output", $JsonPath
)
if ($Simplified) {
    $exportArguments += @("--simplified", $Simplified)
}

Invoke-Checked ".\node_modules\.bin\tsx.cmd" $exportArguments
Invoke-Checked ".\.venv-manim\Scripts\python.exe" @(
    "tools/manim_renderer/render.py", $JsonPath, "--validate"
)
Invoke-Checked ".\.venv-manim\Scripts\python.exe" @(
    "tools/manim_renderer/render.py", $JsonPath,
    "--output", $VideoPath,
    "--resolution", $Resolution,
    "--fps", $Fps.ToString(),
    "--background", $Background,
    "--hold", $FinalHold.ToString([Globalization.CultureInfo]::InvariantCulture)
)
