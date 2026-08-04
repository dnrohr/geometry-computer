param(
    [string]$ManimPath = "C:\Users\dnroh\Documents\third_party\manim",
    [string]$EnvironmentPath = ".venv-manim"
)

$ErrorActionPreference = "Stop"
$python = Get-Command py -ErrorAction Stop
if (-not (Test-Path -LiteralPath $ManimPath)) {
    throw "ManimGL checkout not found: $ManimPath"
}

function Invoke-Checked {
    param([string]$Executable, [string[]]$Arguments)
    & $Executable @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$Executable failed with exit code $LASTEXITCODE"
    }
}

Invoke-Checked $python.Source @("-3.12", "-m", "venv", $EnvironmentPath)
$environmentPython = Join-Path $EnvironmentPath "Scripts\python.exe"
Invoke-Checked $environmentPython @("-m", "pip", "install", "--upgrade", "pip", "setuptools", "wheel")
Invoke-Checked $environmentPython @("-m", "pip", "install", "-r", (Join-Path $ManimPath "requirements.txt"))
Invoke-Checked $environmentPython @("-m", "pip", "install", "-e", $ManimPath, "--no-deps")
Invoke-Checked $environmentPython @("tools\manim_renderer\preflight.py")
