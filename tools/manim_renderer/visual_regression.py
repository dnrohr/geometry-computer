"""Small, dependency-light perceptual checks for rendered reference frames."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from PIL import Image, ImageStat


def difference_hash(path: Path, size: int = 16) -> str:
    image = Image.open(path).convert("L").resize((size + 1, size))
    pixels = list(image.get_flattened_data())
    bits = []
    for row in range(size):
        offset = row * (size + 1)
        bits.extend(pixels[offset + column] > pixels[offset + column + 1] for column in range(size))
    value = sum(int(bit) << index for index, bit in enumerate(bits))
    return f"{value:0{size * size // 4}x}"


def frame_metrics(path: Path) -> dict[str, Any]:
    image = Image.open(path).convert("RGB")
    mean = ImageStat.Stat(image.resize((64, 64))).mean
    return {"dhash": difference_hash(path), "meanRgb": [round(value, 2) for value in mean]}


def hamming(left: str, right: str) -> int:
    return (int(left, 16) ^ int(right, 16)).bit_count()


def compare(actual: dict[str, Any], expected: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    hash_distance = hamming(actual["dhash"], expected["dhash"])
    if hash_distance > expected.get("maxHashDistance", 24):
        errors.append(f"perceptual hash distance {hash_distance} exceeds limit")
    color_distance = max(abs(a - b) for a, b in zip(actual["meanRgb"], expected["meanRgb"]))
    if color_distance > expected.get("maxMeanRgbDistance", 8):
        errors.append(f"mean color distance {color_distance:.2f} exceeds limit")
    return errors


def load_manifest(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as source:
        return json.load(source)
