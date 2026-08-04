import tempfile
import unittest
from pathlib import Path

from PIL import Image

from visual_regression import compare, frame_metrics, hamming


class VisualRegressionTests(unittest.TestCase):
    def test_identical_images_have_identical_metrics(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "frame.png"
            Image.new("RGB", (32, 32), "#123456").save(path)
            metrics = frame_metrics(path)
            self.assertEqual([], compare(metrics, metrics))

    def test_hash_distance_counts_changed_bits(self):
        self.assertEqual(2, hamming("0", "3"))

    def test_large_color_change_is_rejected(self):
        expected = {"dhash": "0", "meanRgb": [0, 0, 0], "maxMeanRgbDistance": 8}
        actual = {"dhash": "0", "meanRgb": [20, 0, 0]}
        self.assertTrue(compare(actual, expected))


if __name__ == "__main__":
    unittest.main()
