import sys
import unittest
from pathlib import Path

from service import JobManager, RenderJob, combine_origami_session, origin_allowed
import json


class RenderServiceTests(unittest.TestCase):
    def test_only_local_browser_origins_are_allowed(self):
        self.assertTrue(origin_allowed("http://localhost:5173"))
        self.assertTrue(origin_allowed("http://127.0.0.1:4173"))
        self.assertFalse(origin_allowed("https://example.com"))

    def test_command_uses_server_selected_paths_and_quality(self):
        manager = JobManager(Path(sys.executable))
        job = RenderJob("abc", {}, {"quality": "high", "foldMode": "hinge"})
        command = manager.command(job, Path("safe-job.json"), Path("safe-output.mp4"))
        self.assertIn("1920x1080", command)
        self.assertIn("hinge", command)
        self.assertNotIn("../user-supplied-output", command)

    def test_output_is_exposed_only_for_completed_jobs(self):
        job = RenderJob("abc", {}, {})
        job.output_path = Path("partial.mp4")
        self.assertNotIn("outputPath", job.public())
        job.status = "complete"
        self.assertIn("outputPath", job.public())

    def test_combines_complete_origami_sessions_with_unique_ids_and_timing(self):
        fixture = Path(__file__).with_name("fixtures") / "valid_origami_v2.json"
        document = json.loads(fixture.read_text(encoding="utf-8"))
        duration = document["metadata"]["duration"]
        session = {
            "schema": "geometry-computer/origami-session", "version": 1,
            "title": "Computed cube root", "duration": duration * 2,
            "steps": [
                {"start": 0, "document": document},
                {"start": duration, "document": document},
            ],
        }
        combined = combine_origami_session(session)
        from render import validate_document
        validate_document(combined)
        self.assertEqual(combined["metadata"]["duration"], duration * 2)
        ids = [item["id"] for item in combined["objects"]]
        self.assertEqual(len(ids), len(set(ids)))
        self.assertGreater(max(action["end"] for action in combined["revealActions"]), duration)

    def test_cancelled_session_cleans_up_its_temporary_document(self):
        fixture = Path(__file__).with_name("fixtures") / "valid_origami_v2.json"
        document = json.loads(fixture.read_text(encoding="utf-8"))
        manager = JobManager(Path(sys.executable))
        job = RenderJob("cancelcleanup", document, {})
        job.cancel_requested = True
        manager._run(job)
        self.assertEqual(job.status, "cancelled")
        temp_document = Path(__file__).resolve().parents[2] / "media" / "service" / ".jobs" / "cancelcleanup.json"
        self.assertFalse(temp_document.exists())


if __name__ == "__main__":
    unittest.main()
