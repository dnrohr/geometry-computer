import unittest
from pathlib import Path

from render import (
    RenderDocumentError,
    Viewport,
    load_document,
    resolve_hinge_mode,
    validate_document,
)


class RendererContractTests(unittest.TestCase):
    def test_svg_coordinates_are_centered_and_y_is_flipped(self):
        viewport = Viewport.parse("0 0 200 100")
        self.assertEqual(viewport.point({"x": 100, "y": 50}), [0.0, -0.0, 0.0])
        self.assertGreater(viewport.point({"x": 100, "y": 0})[1], 0)

    def test_current_euclidean_export_is_supported(self):
        fixture = Path(__file__).parent / "fixtures" / "valid_euclidean_v2.json"
        self.assertEqual(load_document(fixture)["version"], 2)

    def test_origami_fold_requires_target_geometry(self):
        fixture = Path(__file__).parent / "fixtures" / "valid_origami_v2.json"
        document = load_document(fixture)
        document["revealActions"][1].pop("targetPoints")
        with self.assertRaisesRegex(RenderDocumentError, "targetPoints"):
            validate_document(document)

    def test_legacy_fixture_is_migrated(self):
        fixture = Path(__file__).parent / "fixtures" / "legacy_euclidean_v1.json"
        document = load_document(fixture)
        self.assertEqual(document["version"], 2)
        self.assertEqual(document["metadata"]["schema"], "geometry-computer/render-document")

    def test_shared_invalid_fixtures_are_rejected(self):
        fixtures = Path(__file__).parent / "fixtures"
        for fixture in fixtures.glob("invalid_*.json"):
            with self.subTest(fixture=fixture.name):
                with self.assertRaises(RenderDocumentError):
                    load_document(fixture)

    def test_multi_face_hinges_fall_back_or_fail_by_policy(self):
        fixture = Path(__file__).parent / "fixtures" / "valid_origami_v2.json"
        document = load_document(fixture)
        second = dict(document["objects"][0])
        second["id"] = "paper-2"
        document["objects"].append(second)
        action = dict(document["revealActions"][1])
        action["id"] = "fold-paper-2"
        action["objectId"] = "paper-2"
        document["revealActions"].append(action)
        document["renderSettings"] = {"foldMode": "hinge", "collisionPolicy": "flat"}
        enabled, warning = resolve_hinge_mode(document)
        self.assertFalse(enabled)
        self.assertIn("unsupported", warning)
        document["renderSettings"]["collisionPolicy"] = "error"
        with self.assertRaisesRegex(RenderDocumentError, "collision"):
            resolve_hinge_mode(document)


if __name__ == "__main__":
    unittest.main()
