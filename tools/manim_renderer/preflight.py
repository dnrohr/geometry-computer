"""Check the local ManimGL video-rendering environment."""

from __future__ import annotations

import argparse
import importlib
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


MINIMUM_PYTHON = (3, 11)
MAXIMUM_PYTHON = (3, 12)
REQUIRED_MODULES = ("manimlib", "moderngl", "manimpango", "numpy", "PIL", "trimesh")


def executable(name: str) -> str | None:
    found = shutil.which(name)
    if found:
        return found
    if os.name == "nt":
        for scope in ("User", "Machine"):
            result = subprocess.run(
                ["powershell", "-NoProfile", "-Command", f"[Environment]::GetEnvironmentVariable('Path','{scope}')"],
                capture_output=True,
                text=True,
                timeout=10,
                check=False,
            )
            for directory in result.stdout.strip().split(";"):
                candidate = Path(directory) / f"{name}.exe"
                if candidate.exists():
                    return str(candidate)
        link = Path(os.environ.get("LOCALAPPDATA", "")) / "Microsoft" / "WinGet" / "Links" / f"{name}.exe"
        if link.exists():
            return str(link)
    return None


def command_version(command: str, argument: str = "-version") -> str:
    result = subprocess.run(
        [command, argument], capture_output=True, text=True, timeout=15, check=False
    )
    output = result.stdout or result.stderr
    return output.splitlines()[0].strip() if output else "version unknown"


def writable_directory(path: Path) -> bool:
    try:
        path.mkdir(parents=True, exist_ok=True)
        with tempfile.NamedTemporaryFile(dir=path, prefix="preflight-", delete=True):
            pass
        return True
    except OSError:
        return False


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", type=Path, default=Path("media"))
    parser.add_argument("--require-latex", action="store_true")
    args = parser.parse_args()

    failures: list[str] = []
    warnings: list[str] = []
    ffmpeg = executable("ffmpeg")
    if ffmpeg:
        os.environ["PATH"] = f"{Path(ffmpeg).parent}{os.pathsep}{os.environ.get('PATH', '')}"
    version = sys.version_info[:2]
    if not (MINIMUM_PYTHON <= version <= MAXIMUM_PYTHON):
        failures.append(
            f"Python {version[0]}.{version[1]} is unsupported; use Python 3.11 or 3.12."
        )
    else:
        print(f"[ok] Python {sys.version.split()[0]} ({sys.executable})")

    for module in REQUIRED_MODULES:
        try:
            imported = importlib.import_module(module)
            module_version = getattr(imported, "__version__", "installed")
            print(f"[ok] {module}: {module_version}")
        except Exception as exc:  # report native-library import failures too
            failures.append(f"Cannot import {module}: {exc}")

    if ffmpeg:
        print(f"[ok] {command_version(ffmpeg)}")
    else:
        failures.append("ffmpeg is missing; install Gyan.FFmpeg or add ffmpeg to PATH.")

    latex = executable("latex")
    if latex:
        print(f"[ok] {command_version(latex, '--version')}")
    elif args.require_latex:
        failures.append("LaTeX is required but missing; install MiKTeX or TeX Live.")
    else:
        warnings.append("LaTeX is not installed; plain Text labels work, but Tex labels do not.")

    if writable_directory(args.output_dir.resolve()):
        print(f"[ok] Output directory is writable: {args.output_dir.resolve()}")
    else:
        failures.append(f"Output directory is not writable: {args.output_dir.resolve()}")

    for warning in warnings:
        print(f"[warning] {warning}")
    for failure in failures:
        print(f"[error] {failure}", file=sys.stderr)
    if failures:
        print(f"Preflight failed with {len(failures)} error(s).", file=sys.stderr)
        return 1
    print("Preflight passed. Run the smoke render to verify OpenGL and encoding.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
