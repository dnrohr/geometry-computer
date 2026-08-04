"""Render Geometry Computer exports with the local ManimGL checkout.

The module deliberately imports ManimGL only when a scene is rendered.  JSON
validation and coordinate conversion therefore remain usable in CI without an
OpenGL/ffmpeg installation.
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any


SUPPORTED_KINDS = {
    "point", "segment", "line", "ray", "circle", "arc", "label", "triangle",
    "polygon", "crease", "arrow",
}
SUPPORTED_ANIMATIONS = {
    "draw", "fade-in", "fade-out", "pulse", "highlight", "select", "dim", "fold", "unfold",
}


class RenderDocumentError(ValueError):
    pass


@dataclass(frozen=True)
class Viewport:
    x: float
    y: float
    width: float
    height: float
    frame_width: float = 12.0
    frame_height: float = 6.75

    @classmethod
    def parse(cls, value: str) -> "Viewport":
        try:
            x, y, width, height = (float(part) for part in value.split())
        except (TypeError, ValueError) as exc:
            raise RenderDocumentError("viewBox must contain four numbers") from exc
        if width <= 0 or height <= 0:
            raise RenderDocumentError("viewBox dimensions must be positive")
        return cls(x, y, width, height)

    @property
    def scale(self) -> float:
        return min(self.frame_width / self.width, self.frame_height / self.height)

    def point(self, point: dict[str, Any]) -> list[float]:
        """Map SVG coordinates (y down) into centered Manim coordinates (y up)."""
        px = (float(point["x"]) - self.x - self.width / 2) * self.scale
        py = -(float(point["y"]) - self.y - self.height / 2) * self.scale
        return [px, py, 0.0]


def load_document(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as source:
        document = json.load(source)
    validate_document(document)
    return migrate_document(document)


def migrate_document(document: dict[str, Any]) -> dict[str, Any]:
    if document["version"] == 2:
        return document
    x, y, width, height = (float(part) for part in document["viewBox"].split())
    del x, y
    migrated = dict(document)
    migrated["version"] = 2
    migrated["metadata"] = {
        "schema": "geometry-computer/render-document",
        "generator": {"name": "geometry-computer", "version": "0.1.0"},
        "title": document.get("expression") or "Geometric construction",
        "aspectRatio": {"width": width, "height": height},
        "theme": "geometry-computer-dark",
        "duration": max((float(action["end"]) for action in document["revealActions"]), default=0),
    }
    return migrated


def validate_document(document: dict[str, Any]) -> None:
    if document.get("version") not in (1, 2):
        raise RenderDocumentError("only Geometry Computer export versions 1 and 2 are supported")
    Viewport.parse(document.get("viewBox", ""))
    objects = document.get("objects")
    actions = document.get("revealActions")
    if not all(isinstance(document.get(key), list) for key in ("objects", "steps", "revealActions", "proofs")):
        raise RenderDocumentError("objects, steps, revealActions, and proofs must be arrays")
    if not isinstance(document.get("expression"), str) or not isinstance(document.get("simplifiedExpression"), str):
        raise RenderDocumentError("expression and simplifiedExpression must be strings")
    values = document.get("values")
    if not isinstance(values, dict) or not all(isinstance(value, (int, float)) for value in values.values()):
        raise RenderDocumentError("values must contain only numbers")
    if document["version"] == 2:
        metadata = document.get("metadata")
        generator = metadata.get("generator") if isinstance(metadata, dict) else None
        ratio = metadata.get("aspectRatio") if isinstance(metadata, dict) else None
        if (
            not isinstance(metadata, dict)
            or metadata.get("schema") != "geometry-computer/render-document"
            or not isinstance(generator, dict)
            or generator.get("name") != "geometry-computer"
            or not isinstance(generator.get("version"), str)
            or not generator.get("version")
            or not isinstance(metadata.get("title"), str)
            or not metadata.get("title")
            or not isinstance(ratio, dict)
            or not isinstance(ratio.get("width"), (int, float))
            or not isinstance(ratio.get("height"), (int, float))
            or ratio["width"] <= 0
            or ratio["height"] <= 0
            or not isinstance(metadata.get("theme"), str)
            or not isinstance(metadata.get("duration"), (int, float))
            or metadata["duration"] < 0
        ):
            raise RenderDocumentError("version 2 metadata is invalid")
    ids: set[str] = set()
    dependencies: list[tuple[str, str]] = []
    for item in objects:
        object_id = item.get("id")
        kind = item.get("kind")
        if (
            not isinstance(object_id, str) or not object_id
            or not isinstance(item.get("createdByStepId"), str) or not item["createdByStepId"]
            or not isinstance(item.get("usedByStepIds"), list)
            or not isinstance(item.get("dependsOnObjectIds"), list)
        ):
            raise RenderDocumentError("every object needs identity and provenance")
        if object_id in ids:
            raise RenderDocumentError(f"duplicate object id: {object_id}")
        if kind not in SUPPORTED_KINDS:
            raise RenderDocumentError(f"unsupported object kind: {kind}")
        if not all(isinstance(value, str) for value in item["usedByStepIds"] + item["dependsOnObjectIds"]):
            raise RenderDocumentError("object provenance IDs must be strings")
        data = item.get("data")
        if not isinstance(data, dict) or data.get("kind") != kind:
            raise RenderDocumentError(f"object data kind must match {kind}")
        is_number = lambda value: isinstance(value, (int, float)) and not isinstance(value, bool)
        is_point = lambda value: isinstance(value, dict) and is_number(value.get("x")) and is_number(value.get("y"))
        if kind == "point" and not is_point(data.get("position")):
            raise RenderDocumentError("point geometry is invalid")
        if kind in ("segment", "line", "ray", "crease", "arrow") and not (is_point(data.get("start")) and is_point(data.get("end"))):
            raise RenderDocumentError(f"{kind} geometry is invalid")
        if kind in ("circle", "arc") and not (is_point(data.get("center")) and is_number(data.get("radius")) and data["radius"] >= 0):
            raise RenderDocumentError(f"{kind} geometry is invalid")
        if kind == "arc" and not (is_number(data.get("startAngle")) and is_number(data.get("endAngle"))):
            raise RenderDocumentError("arc angles are invalid")
        if kind == "label" and not (is_point(data.get("position")) and isinstance(data.get("text"), str)):
            raise RenderDocumentError("label geometry is invalid")
        if kind in ("triangle", "polygon") and not (
            isinstance(data.get("points"), list)
            and len(data["points"]) >= 3
            and all(is_point(point) for point in data["points"])
            and (kind != "triangle" or len(data["points"]) == 3)
        ):
            raise RenderDocumentError(f"{kind} geometry is invalid")
        if kind == "polygon" and (
            ("layer" in data and not is_number(data["layer"]))
            or ("side" in data and data["side"] not in ("front", "back"))
        ):
            raise RenderDocumentError("polygon material or layer is invalid")
        dependencies.extend((object_id, dependency) for dependency in item["dependsOnObjectIds"])
        ids.add(object_id)
    for object_id, dependency in dependencies:
        if dependency not in ids:
            raise RenderDocumentError(f"object {object_id} references unknown dependency {dependency}")
    action_ids: set[str] = set()
    for action in actions:
        animation = action.get("animation")
        if animation not in SUPPORTED_ANIMATIONS:
            raise RenderDocumentError(f"unsupported animation: {animation}")
        if not isinstance(action.get("id"), str) or not isinstance(action.get("stepId"), str):
            raise RenderDocumentError("every action needs an id and stepId")
        if action["id"] in action_ids:
            raise RenderDocumentError(f"duplicate action id: {action['id']}")
        action_ids.add(action["id"])
        if action.get("objectId") not in ids:
            raise RenderDocumentError(f"action references unknown object: {action.get('objectId')}")
        if not isinstance(action.get("start"), (int, float)) or not isinstance(action.get("end"), (int, float)) or action["start"] < 0 or action["end"] < action["start"]:
            raise RenderDocumentError("action timing is invalid")
        if animation in ("fold", "unfold") and (
            not action.get("targetPoints")
            or action.get("creaseObjectId") not in ids
            or action.get("movingSide") not in ("left", "right")
        ):
            raise RenderDocumentError("fold actions require a crease, movingSide, and targetPoints")
        if animation in ("fold", "unfold") and (
            ("targetLayer" in action and not isinstance(action["targetLayer"], (int, float)))
            or ("targetSide" in action and action["targetSide"] not in ("front", "back"))
        ):
            raise RenderDocumentError("fold target material or layer is invalid")


def _install_manim_path() -> None:
    checkout = os.environ.get("MANIMGL_PATH")
    if checkout and checkout not in sys.path:
        sys.path.insert(0, checkout)


def _prepare_process_path() -> None:
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg and os.name == "nt":
        for scope in ("User", "Machine"):
            result = __import__("subprocess").run(
                ["powershell", "-NoProfile", "-Command", f"[Environment]::GetEnvironmentVariable('Path','{scope}')"],
                capture_output=True,
                text=True,
                check=False,
            )
            os.environ["PATH"] = f"{result.stdout.strip()}{os.pathsep}{os.environ.get('PATH', '')}"


def resolve_hinge_mode(document: dict[str, Any]) -> tuple[bool, str | None]:
    settings = document.get("renderSettings", {})
    if settings.get("foldMode") != "hinge":
        return False, None
    fold_actions = [
        action for action in document["revealActions"]
        if action["animation"] in ("fold", "unfold")
    ]
    if len({action["objectId"] for action in fold_actions}) > 1:
        message = "3D collision handling for simultaneous multi-face folds is unsupported"
        if settings.get("collisionPolicy") == "error":
            raise RenderDocumentError(message)
        return False, f"{message}; using flat fold animation"
    return True, None


def build_scene_class(document: dict[str, Any]):
    _install_manim_path()
    _prepare_process_path()
    original_argv = sys.argv
    sys.argv = [sys.argv[0]]
    try:
        from manimlib import (  # type: ignore
            Animation, Arc, Arrow, Circle, DashedLine, Dot, FadeIn, FadeOut, FlashAround,
            Line, PI, Point, Polygon, Scene, ShowCreation, Succession, Text, Transform, smooth,
        )
        import numpy as np
    except ImportError as exc:
        raise RuntimeError(
            "ManimGL is unavailable. Set MANIMGL_PATH to the checkout and install its Python dependencies."
        ) from exc
    finally:
        sys.argv = original_argv

    viewport = Viewport.parse(document["viewBox"])
    role_colors = {
        "input": "#5ca9e6", "unit": "#8bcf7b", "active-construction": "#f0b84b",
        "scaffold": "#798493", "intermediate": "#b68ce3", "result": "#f0b84b",
        "proof-highlight": "#f47c7c", "ghost": "#59616d", "paper": "#e8dfc8",
        "crease": "#d9785f",
    }
    paper_colors = {"front": "#e8dfc8", "back": "#d9917b"}
    items = {item["id"]: item for item in document["objects"]}
    render_settings = document.get("renderSettings", {})
    hinge_enabled, hinge_warning = resolve_hinge_mode(document)
    if hinge_warning:
        print(f"warning: {hinge_warning}")

    class HingeFold(Animation):
        def __init__(self, mobject, target, axis, about_point, target_side, target_layer, run_time):
            self.target = target
            self.axis = axis
            self.about_point = about_point
            self.target_side = target_side
            self.target_layer = target_layer
            super().__init__(mobject, run_time=run_time, rate_func=smooth)

        def interpolate_mobject(self, alpha):
            hinge_fraction = min(1.0, alpha / 0.94)
            rotated = self.starting_mobject.copy()
            rotated.rotate(
                self.rate_func(self.time_spanned_alpha(hinge_fraction)) * PI,
                axis=self.axis,
                about_point=self.about_point,
            )
            if alpha >= 0.5 and self.target_side in paper_colors:
                rotated.set_fill(paper_colors[self.target_side], opacity=0.82)
                rotated.set_z_index(self.target_layer)
            self.mobject.become(rotated)
            if alpha > 0.94:
                self.mobject.interpolate(rotated, self.target, (alpha - 0.94) / 0.06)

    def points(data: dict[str, Any]) -> list[list[float]]:
        return [viewport.point(point) for point in data["points"]]

    def make_mobject(item: dict[str, Any]):
        data, kind = item["data"], item["kind"]
        color = role_colors.get(item.get("role"), "#d8dee9")
        if kind == "point":
            result = Dot(viewport.point(data["position"]), radius=0.045)
            result.set_z_index(90)
        elif kind in ("segment", "line", "ray"):
            result = Line(viewport.point(data["start"]), viewport.point(data["end"]))
            if kind == "line":
                result.set_length(20)
            elif kind == "ray":
                result.add_tip()
        elif kind == "crease":
            result = DashedLine(viewport.point(data["start"]), viewport.point(data["end"]))
            result.set_z_index(100)
        elif kind == "arrow":
            result = Arrow(viewport.point(data["start"]), viewport.point(data["end"]), buff=0.08)
            result.set_z_index(80)
        elif kind == "circle":
            result = Circle(radius=float(data["radius"]) * viewport.scale)
            result.move_to(viewport.point(data["center"]))
        elif kind == "arc":
            result = Arc(
                start_angle=-float(data["endAngle"]),
                angle=float(data["endAngle"] - data["startAngle"]),
                radius=float(data["radius"]) * viewport.scale,
            ).move_to(viewport.point(data["center"]))
        elif kind == "label":
            result = Text(str(data["text"]), font_size=28).move_to(viewport.point(data["position"]))
            result.set_z_index(90)
        elif kind in ("triangle", "polygon"):
            fill = paper_colors.get(data.get("side"), color)
            result = Polygon(*points(data)).set_fill(fill, opacity=0.16 if kind == "triangle" else 0.82)
            if kind == "polygon":
                result.set_z_index(int(data.get("layer", 0)))
                if hinge_enabled:
                    result.set_shading(reflectiveness=0.12, gloss=0.08, shadow=0.22)
        else:  # validation makes this unreachable
            raise RenderDocumentError(f"unsupported object kind: {kind}")
        result.set_stroke(color=color, width=2.5)
        if str(item["id"]).startswith("fold-target-line"):
            result.set_z_index(70)
        result.geometry_computer_id = item["id"]
        return result

    class GeometryComputerScene(Scene):
        def construct(self):
            if hinge_enabled:
                camera_scale = max(1.0, float(render_settings.get("cameraScale", 1.4)))
                self.frame.reorient(
                    float(render_settings.get("cameraTheta", -18)),
                    float(render_settings.get("cameraPhi", 62)),
                    height=self.frame.get_height() * camera_scale,
                )
            objects = {item["id"]: make_mobject(item) for item in document["objects"]}
            visible: set[str] = set()
            animated_ids = {action["objectId"] for action in document["revealActions"]}
            for object_id, mobject in objects.items():
                if object_id not in animated_ids:
                    self.add(mobject)
                    visible.add(object_id)

            by_object: dict[str, list[dict[str, Any]]] = {}
            for action in document["revealActions"]:
                by_object.setdefault(action["objectId"], []).append(action)
            timelines = []
            for actions in by_object.values():
                animations = []
                cursor = 0.0
                for action in sorted(actions, key=lambda item: (item["start"], item["end"])):
                    start = float(action["start"])
                    if start > cursor:
                        animations.append(Animation(Point(), run_time=start - cursor))
                    effect = self._effect(action, objects, visible)
                    animations.append(effect)
                    cursor = max(start, cursor) + effect.get_run_time()
                timelines.append(Succession(*animations))
            if timelines:
                self.play(*timelines)
            hold = float(document.get("renderSettings", {}).get("finalHold", 0))
            if hold > 0:
                self.wait(hold)

        def _effect(self, action, objects, visible):
                object_id = action["objectId"]
                mobject = objects[object_id]
                animation = action["animation"]
                run_time = max(0.1, float(action["end"]) - float(action["start"]))
                if animation == "draw":
                    visible.add(object_id)
                    return ShowCreation(mobject, run_time=run_time)
                elif animation == "fade-in":
                    visible.add(object_id)
                    return FadeIn(mobject, run_time=run_time)
                elif animation == "fade-out":
                    visible.discard(object_id)
                    return FadeOut(mobject, run_time=run_time)
                elif animation in ("fold", "unfold"):
                    if object_id not in visible:
                        self.add(mobject)
                        visible.add(object_id)
                    target = mobject.copy().set_points_as_corners(points({"points": action["targetPoints"]}) + [viewport.point(action["targetPoints"][0])])
                    target_side = action.get("targetSide")
                    if target_side in paper_colors:
                        target.set_fill(paper_colors[target_side], opacity=0.82)
                    target.set_z_index(int(action.get("targetLayer", 0)))
                    if hinge_enabled:
                        crease = items[action["creaseObjectId"]]["data"]
                        hinge_start = np.array(viewport.point(crease["start"]))
                        hinge_end = np.array(viewport.point(crease["end"]))
                        axis = hinge_end - hinge_start
                        axis_length = np.linalg.norm(axis)
                        if axis_length <= 1e-9:
                            if render_settings.get("collisionPolicy") == "error":
                                raise RenderDocumentError("hinge crease has zero rendered length")
                            return Transform(mobject, target, run_time=run_time)
                        hinge = HingeFold(
                            mobject,
                            target,
                            axis / axis_length,
                            hinge_start,
                            target_side,
                            int(action.get("targetLayer", 0)),
                            run_time=run_time,
                        )
                        return hinge
                    return Transform(mobject, target, run_time=run_time)
                elif animation in ("pulse", "highlight", "select"):
                    return FlashAround(mobject, run_time=run_time)
                else:  # dim
                    return mobject.animate(run_time=run_time).set_opacity(0.25)

    return GeometryComputerScene


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("document", type=Path, help="Geometry Computer JSON export")
    parser.add_argument("--validate", action="store_true", help="validate only; do not invoke ManimGL")
    parser.add_argument("--output", type=Path, default=Path("media/manim/construction.mp4"))
    parser.add_argument("--resolution", default="1280x720", help="WIDTHxHEIGHT")
    parser.add_argument("--fps", type=int, default=30)
    parser.add_argument("--background", default="#1f2329")
    parser.add_argument("--hold", type=float, default=0.75, help="final-frame hold in seconds")
    parser.add_argument("--fold-mode", choices=("flat", "hinge"), default="flat")
    parser.add_argument("--camera-theta", type=float, default=-18)
    parser.add_argument("--camera-phi", type=float, default=62)
    parser.add_argument("--camera-scale", type=float, default=1.4)
    parser.add_argument("--collision-policy", choices=("flat", "error"), default="flat")
    args = parser.parse_args()
    document = load_document(args.document)
    if args.validate:
        print(f"valid: {len(document['objects'])} objects, {len(document['revealActions'])} actions")
        return
    try:
        width, height = (int(value) for value in args.resolution.lower().split("x"))
    except ValueError as exc:
        parser.error(f"invalid resolution: {args.resolution}; use WIDTHxHEIGHT")
        raise exc
    if width <= 0 or height <= 0 or args.fps <= 0 or args.hold < 0 or args.camera_scale < 1:
        parser.error("resolution and fps must be positive; hold cannot be negative")
    if args.output.suffix.lower() != ".mp4":
        parser.error("output must use the .mp4 extension")
    document["renderSettings"] = {
        "finalHold": args.hold,
        "foldMode": args.fold_mode,
        "cameraTheta": args.camera_theta,
        "cameraPhi": args.camera_phi,
        "cameraScale": args.camera_scale,
        "collisionPolicy": args.collision_policy,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    scene_class = build_scene_class(document)
    print("phase: scene-construction", flush=True)
    scene = scene_class(
        camera_config={"resolution": (width, height), "fps": args.fps, "background_color": args.background},
        file_writer_config={
            "write_to_movie": True,
            "output_directory": str(args.output.parent.resolve()),
            "file_name": args.output.stem,
        },
    )
    print("phase: encoding", flush=True)
    scene.run()
    print(f"Rendered {args.output.resolve()}")


if __name__ == "__main__":
    main()
