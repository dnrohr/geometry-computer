$ErrorActionPreference = "Stop"
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
$machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
$env:Path = "$userPath;$machinePath"

& ".\.venv-manim\Scripts\manimgl.exe" `
    "tools/manim_renderer/smoke_scene.py" `
    "GeometryComputerSmoke" `
    -w -l -r "640x360" --fps 15 `
    --video_dir "media/smoke" `
    --file_name "geometry-computer-smoke"

if ($LASTEXITCODE -ne 0) {
    throw "ManimGL smoke render failed with exit code $LASTEXITCODE"
}
