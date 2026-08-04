"""Render references and check visual, timing, path, and cleanup invariants."""

from __future__ import annotations
import argparse, json, subprocess, sys, tempfile, time
from pathlib import Path
from preflight import executable
from visual_regression import compare, frame_metrics, load_manifest

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
MANIFEST = HERE / "golden" / "manifest.json"
CASES = (
    ("euclidean", HERE / "fixtures" / "valid_euclidean_v2.json", "flat", 60.0),
    ("origami-flat", HERE / "fixtures" / "valid_origami_v2.json", "flat", 60.0),
    ("origami-hinge", HERE / "fixtures" / "valid_origami_v2.json", "hinge", 60.0),
)

def run_checked(command: list[str]) -> None:
    result = subprocess.run(command, cwd=ROOT, text=True, capture_output=True, timeout=90)
    if result.returncode:
        raise RuntimeError(f"command failed ({result.returncode})\n{result.stdout}\n{result.stderr}")

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--approve", action="store_true", help="replace expected signatures")
    parser.add_argument("--report", type=Path, help="write machine-readable results")
    args = parser.parse_args()
    ffmpeg = executable("ffmpeg")
    if not ffmpeg:
        print("[error] ffmpeg is not available", file=sys.stderr); return 1
    expected = {} if args.approve else load_manifest(MANIFEST)["cases"]
    actual, results, failures = {}, [], []
    temporary_root = None
    with tempfile.TemporaryDirectory(prefix="geometry computer quality ü ") as directory:
        temporary_root = Path(directory)
        for name, document, fold_mode, budget in CASES:
            output, frame = temporary_root / f"{name} result.mp4", temporary_root / f"{name} frame.png"
            command = [sys.executable, str(HERE / "render.py"), str(document), "--output", str(output),
                       "--resolution", "640x360", "--fps", "15", "--hold", "0.25", "--fold-mode", fold_mode]
            started = time.perf_counter()
            try:
                run_checked(command); elapsed = time.perf_counter() - started
                run_checked([ffmpeg, "-y", "-sseof", "-0.15", "-i", str(output), "-frames:v", "1", str(frame)])
                metrics = frame_metrics(frame)
                actual[name] = {**metrics, "maxHashDistance": 32, "maxMeanRgbDistance": 10}
                errors = [] if args.approve else compare(metrics, expected[name])
                if elapsed > budget: errors.append(f"render time {elapsed:.2f}s exceeds {budget:.0f}s budget")
                data = json.loads(document.read_text(encoding="utf-8")); count = len(data["objects"])
                results.append({"case": name, "seconds": round(elapsed, 3), "objects": count, "errors": errors})
                failures.extend(f"{name}: {error}" for error in errors)
                print(f"[{'ok' if not errors else 'error'}] {name}: {elapsed:.2f}s, {count} objects")
            except Exception as exc:
                failures.append(f"{name}: {exc}"); print(f"[error] {name}: {exc}", file=sys.stderr)
        leftovers = [p for p in temporary_root.rglob("*") if p.suffix in {".tmp", ".partial"}]
        if leftovers: failures.append(f"temporary render artifacts remain: {leftovers}")
    if temporary_root and temporary_root.exists(): failures.append(f"temporary directory was not removed: {temporary_root}")
    if args.approve and not failures:
        MANIFEST.parent.mkdir(parents=True, exist_ok=True)
        MANIFEST.write_text(json.dumps({"schemaVersion": 1, "cases": actual}, indent=2) + "\n", encoding="utf-8")
        print(f"Approved golden signatures in {MANIFEST}")
    report = {"passed": not failures, "results": results, "failures": failures}
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    for failure in failures: print(f"[error] {failure}", file=sys.stderr)
    return 1 if failures else 0

if __name__ == "__main__": raise SystemExit(main())
