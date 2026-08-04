"""Localhost-only job service for browser-initiated ManimGL renders."""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
import threading
import time
import uuid
from dataclasses import dataclass, field
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from render import RenderDocumentError, validate_document


MAX_DOCUMENT_BYTES = 5 * 1024 * 1024
WORKSPACE = Path(__file__).resolve().parents[2]
OUTPUT_DIRECTORY = WORKSPACE / "media" / "service"
TEMP_DIRECTORY = OUTPUT_DIRECTORY / ".jobs"
ALLOWED_ORIGIN = re.compile(r"^https?://(?:localhost|127\.0\.0\.1)(?::\d+)?$")


def combine_origami_session(session: dict[str, Any]) -> dict[str, Any]:
    """Flatten a complete browser session into one canonical render document."""
    if session.get("schema") != "geometry-computer/origami-session" or session.get("version") != 1:
        raise RenderDocumentError("Unsupported origami session.")
    steps = session.get("steps")
    if not isinstance(steps, list) or not steps:
        raise RenderDocumentError("An origami render session must contain steps.")
    objects: list[dict[str, Any]] = []
    construction_steps: list[dict[str, Any]] = []
    actions: list[dict[str, Any]] = []
    proofs: list[dict[str, Any]] = []
    for index, session_step in enumerate(steps):
        if not isinstance(session_step, dict) or not isinstance(session_step.get("document"), dict):
            raise RenderDocumentError("Every origami session step must include a render document.")
        document = session_step["document"]
        validate_document(document)
        prefix = f"session-{index + 1}-"
        object_ids = {item["id"]: prefix + item["id"] for item in document["objects"]}
        step_ids = {item["id"]: prefix + item["id"] for item in document["steps"]}
        proof_ids = {item["id"]: prefix + item["id"] for item in document.get("proofs", [])}
        def mapped(value: Any, key: str = "") -> Any:
            if isinstance(value, list):
                return [mapped(item, key) for item in value]
            if isinstance(value, dict):
                return {child_key: mapped(child, child_key) for child_key, child in value.items()}
            if isinstance(value, str):
                if key in ("id", "objectId", "creaseObjectId", "createdByStepId"):
                    return object_ids.get(value, step_ids.get(value, proof_ids.get(value, prefix + value)))
                if key in ("stepId", "parentStepId", "proofId"):
                    return step_ids.get(value, proof_ids.get(value, prefix + value))
                if key.endswith("ObjectIds"):
                    return object_ids.get(value, value)
                return value
            return value
        objects.extend(mapped(item) for item in document["objects"])
        construction_steps.extend(mapped(item) for item in document["steps"])
        offset = float(session_step.get("start", 0))
        for action in document["revealActions"]:
            action = mapped(action)
            action["start"] = float(action["start"]) + offset
            action["end"] = float(action["end"]) + offset
            actions.append(action)
        proofs.extend(mapped(item) for item in document.get("proofs", []))
    first = steps[0]["document"]
    return {
        "version": 2,
        "metadata": {
            **first["metadata"],
            "title": session.get("title", "Computed origami session"),
            "duration": float(session.get("duration", max(action["end"] for action in actions))),
            "narration": "Complete branch-resolved origami compute session.",
        },
        "expression": session.get("title", "Origami session"),
        "simplifiedExpression": session.get("title", "Origami session"),
        "values": {},
        "viewBox": first["viewBox"],
        "objects": objects,
        "steps": construction_steps,
        "revealActions": actions,
        "proofs": proofs,
    }


def origin_allowed(origin: str | None) -> bool:
    return origin is None or bool(ALLOWED_ORIGIN.fullmatch(origin))


@dataclass
class RenderJob:
    id: str
    document: dict[str, Any]
    settings: dict[str, Any]
    status: str = "queued"
    phase: str = "received"
    error: str | None = None
    output_path: Path | None = None
    process: subprocess.Popen[str] | None = field(default=None, repr=False)
    cancel_requested: bool = False
    created_at: float = field(default_factory=time.time)

    def public(self) -> dict[str, Any]:
        result = {
            "id": self.id,
            "status": self.status,
            "phase": self.phase,
            "error": self.error,
        }
        if self.status == "complete" and self.output_path:
            result["outputPath"] = str(self.output_path.resolve())
            result["videoUrl"] = f"/jobs/{self.id}/video"
        return result


class JobManager:
    def __init__(self, python: Path | None = None):
        self.python = python or Path(sys.executable)
        self.jobs: dict[str, RenderJob] = {}
        self.lock = threading.Lock()
        self.render_lock = threading.Lock()

    def create(self, document: dict[str, Any], settings: dict[str, Any]) -> RenderJob:
        job = RenderJob(uuid.uuid4().hex[:12], document, settings)
        with self.lock:
            self.jobs[job.id] = job
        threading.Thread(target=self._run, args=(job,), daemon=True).start()
        return job

    def get(self, job_id: str) -> RenderJob | None:
        with self.lock:
            return self.jobs.get(job_id)

    def cancel(self, job_id: str) -> RenderJob | None:
        job = self.get(job_id)
        if not job:
            return None
        job.cancel_requested = True
        job.status = "cancelling"
        job.phase = "stopping-renderer"
        if job.process and job.process.poll() is None:
            job.process.terminate()
        return job

    def command(self, job: RenderJob, document_path: Path, output_path: Path) -> list[str]:
        settings = job.settings
        quality = settings.get("quality", "standard")
        resolutions = {"draft": "640x360", "standard": "1280x720", "high": "1920x1080"}
        fps_values = {"draft": "15", "standard": "30", "high": "30"}
        return [
            str(self.python), str(Path(__file__).with_name("render.py")), str(document_path),
            "--output", str(output_path), "--resolution", resolutions.get(quality, "1280x720"),
            "--fps", fps_values.get(quality, "30"), "--fold-mode", settings.get("foldMode", "flat"),
            "--collision-policy", "flat", "--hold", "0.75",
        ]

    def _run(self, job: RenderJob) -> None:
        OUTPUT_DIRECTORY.mkdir(parents=True, exist_ok=True)
        TEMP_DIRECTORY.mkdir(parents=True, exist_ok=True)
        document_path = TEMP_DIRECTORY / f"{job.id}.json"
        output_path = OUTPUT_DIRECTORY / f"geometry-computer-{job.id}.mp4"
        render_lock_acquired = False
        try:
            job.status, job.phase = "running", "validating-document"
            validate_document(job.document)
            if job.cancel_requested:
                raise InterruptedError
            document_path.write_text(json.dumps(job.document, indent=2), encoding="utf-8")
            job.phase = "waiting-for-renderer"
            self.render_lock.acquire()
            render_lock_acquired = True
            if job.cancel_requested:
                raise InterruptedError
            job.phase = "preparing-scene"
            job.process = subprocess.Popen(
                self.command(job, document_path, output_path),
                cwd=WORKSPACE,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                encoding="utf-8",
                errors="replace",
            )
            assert job.process.stdout
            captured: list[str] = []
            for line in job.process.stdout:
                captured.append(line.rstrip())
                if line.startswith("phase: scene-construction"):
                    job.phase = "preparing-scene"
                elif line.startswith("phase: encoding"):
                    job.phase = "rendering-and-encoding"
                if job.cancel_requested and job.process.poll() is None:
                    job.process.terminate()
            try:
                exit_code = job.process.wait(timeout=15)
            except subprocess.TimeoutExpired:
                job.process.kill()
                exit_code = job.process.wait(timeout=5)
            if job.cancel_requested:
                raise InterruptedError
            if exit_code != 0 or not output_path.exists():
                detail = next((line for line in reversed(captured) if line.strip()), "Renderer failed.")
                raise RuntimeError(detail)
            job.output_path = output_path
            job.status, job.phase = "complete", "complete"
        except InterruptedError:
            job.status, job.phase = "cancelled", "cancelled"
            output_path.unlink(missing_ok=True)
        except (RenderDocumentError, RuntimeError, OSError, subprocess.SubprocessError) as exc:
            job.status, job.phase, job.error = "failed", "failed", str(exc)
            output_path.unlink(missing_ok=True)
        finally:
            document_path.unlink(missing_ok=True)
            job.process = None
            if render_lock_acquired:
                self.render_lock.release()


class RenderHandler(BaseHTTPRequestHandler):
    manager = JobManager()

    def log_message(self, format: str, *args: Any) -> None:
        print(f"service: {format % args}")

    def _cors(self) -> None:
        origin = self.headers.get("Origin")
        if origin_allowed(origin) and origin:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")

    def _json(self, status: int, value: dict[str, Any]) -> None:
        body = json.dumps(value).encode()
        self.send_response(status)
        self._cors()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _authorized(self) -> bool:
        if origin_allowed(self.headers.get("Origin")):
            return True
        self._json(403, {"error": "Only local Geometry Computer pages may use this renderer."})
        return False

    def do_OPTIONS(self) -> None:
        if not self._authorized():
            return
        self.send_response(204)
        self._cors()
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
        self.end_headers()

    def do_GET(self) -> None:
        if not self._authorized():
            return
        path = urlparse(self.path).path
        if path == "/health":
            self._json(200, {"ok": True})
            return
        match = re.fullmatch(r"/jobs/([a-f0-9]+)/video", path)
        if match:
            job = self.manager.get(match.group(1))
            if not job or job.status != "complete" or not job.output_path:
                self._json(404, {"error": "Completed video not found."})
                return
            self.send_response(200)
            self._cors()
            self.send_header("Content-Type", "video/mp4")
            self.send_header("Content-Disposition", f'attachment; filename="{job.output_path.name}"')
            self.send_header("Content-Length", str(job.output_path.stat().st_size))
            self.end_headers()
            with job.output_path.open("rb") as video:
                shutil.copyfileobj(video, self.wfile)
            return
        match = re.fullmatch(r"/jobs/([a-f0-9]+)", path)
        job = self.manager.get(match.group(1)) if match else None
        self._json(200, job.public()) if job else self._json(404, {"error": "Render job not found."})

    def do_POST(self) -> None:
        if not self._authorized():
            return
        if urlparse(self.path).path != "/jobs":
            self._json(404, {"error": "Not found."})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > MAX_DOCUMENT_BYTES:
                raise ValueError("Render document must be between 1 byte and 5 MB.")
            payload = json.loads(self.rfile.read(length))
            document = payload.get("document")
            session = payload.get("session")
            settings = payload.get("settings", {})
            if document is None and isinstance(session, dict):
                document = combine_origami_session(session)
            if not isinstance(document, dict) or not isinstance(settings, dict):
                raise ValueError("document or session, plus settings, are required.")
            if settings.get("quality", "standard") not in ("draft", "standard", "high"):
                raise ValueError("Unknown video quality.")
            if settings.get("foldMode", "flat") not in ("flat", "hinge"):
                raise ValueError("Unknown fold mode.")
        except (ValueError, json.JSONDecodeError) as exc:
            self._json(400, {"error": str(exc)})
            return
        job = self.manager.create(document, settings)
        self._json(202, job.public())

    def do_DELETE(self) -> None:
        if not self._authorized():
            return
        match = re.fullmatch(r"/jobs/([a-f0-9]+)", urlparse(self.path).path)
        job = self.manager.cancel(match.group(1)) if match else None
        self._json(200, job.public()) if job else self._json(404, {"error": "Render job not found."})


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()
    server = ThreadingHTTPServer(("127.0.0.1", args.port), RenderHandler)
    print(f"Geometry Computer renderer listening on http://127.0.0.1:{args.port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
