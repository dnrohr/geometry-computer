import json
import sys
import tempfile
import unittest
from pathlib import Path

from render import load_document
from service import JobManager, RenderJob


class PathSafetyTests(unittest.TestCase):
    def test_document_loads_from_space_and_unicode_path(self):
        fixture = Path(__file__).with_name("fixtures") / "valid_euclidean_v2.json"
        with tempfile.TemporaryDirectory(prefix="geometry computer ü ") as directory:
            target = Path(directory) / "construction α.json"
            target.write_text(fixture.read_text(encoding="utf-8"), encoding="utf-8")
            self.assertEqual(2, load_document(target)["version"])

    def test_service_preserves_unicode_paths_as_single_arguments(self):
        manager = JobManager(Path(sys.executable))
        document = Path("temp files") / "construction α.json"
        output = Path("video files") / "result ü.mp4"
        command = manager.command(RenderJob("id", {}, {}), document, output)
        self.assertIn(str(document), command)
        self.assertIn(str(output), command)


if __name__ == "__main__":
    unittest.main()
