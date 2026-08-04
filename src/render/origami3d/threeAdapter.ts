import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { evaluateHingeObject } from "../../domain/origami/hinge3d";
import { evaluateOrigamiTimeline } from "../../domain/origami/timeline";
import type { RenderDocumentV2 } from "../../domain/render/types";
import type { CameraPreset, Origami3DAdapter } from "./types";

const disposeObject = (object: THREE.Object3D) => {
  if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
    object.geometry.dispose();
    const material = object.material;
    (Array.isArray(material) ? material : [material]).forEach((item) =>
      item.dispose(),
    );
  }
};

export function createThreeOrigamiAdapter(
  container: HTMLElement,
): Origami3DAdapter {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#202a33");
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.append(renderer.domElement);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  const root = new THREE.Group();
  scene.add(root);
  let center = new THREE.Vector3(5, -3, 0);
  const resize = () => {
    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 260);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const cameraPreset = (preset: CameraPreset) => {
    const span = 13;
    camera.position.copy(
      preset === "top"
        ? new THREE.Vector3(center.x, center.y, span)
        : preset === "side"
          ? new THREE.Vector3(center.x, center.y - span, 2)
          : new THREE.Vector3(center.x + 8, center.y - 8, 9),
    );
    controls.target.copy(center);
    controls.update();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();
  cameraPreset("presentation");
  let animation = 0;
  const renderLoop = () => {
    controls.update();
    renderer.render(scene, camera);
    animation = requestAnimationFrame(renderLoop);
  };
  renderLoop();
  return {
    update(document: RenderDocumentV2, time: number, selectedId?: string) {
      root.traverse(disposeObject);
      root.clear();
      const [x, y, width, height] = document.viewBox.split(/\s+/).map(Number);
      center = new THREE.Vector3(x + width / 2, -(y + height / 2), 0);
      const timeline = evaluateOrigamiTimeline(document, time);
      for (const object of document.objects) {
        const state = timeline[object.id];
        if (!state.visible) continue;
        const data = object.data;
        if (data.kind === "polygon") {
          const hinge = evaluateHingeObject(document, object.id, time)!;
          const shape = new THREE.Shape();
          hinge.points.forEach((point, index) =>
            index
              ? shape.lineTo(point.x, -point.y)
              : shape.moveTo(point.x, -point.y),
          );
          shape.closePath();
          const geometry = new THREE.ShapeGeometry(shape);
          const positions = geometry.getAttribute("position");
          for (let index = 0; index < positions.count; index++) {
            const px = positions.getX(index);
            const py = -positions.getY(index);
            const nearest = hinge.points.reduce(
              (best, point) =>
                Math.hypot(point.x - px, point.y - py) <
                Math.hypot(best.x - px, best.y - py)
                  ? point
                  : best,
              hinge.points[0],
            );
            positions.setZ(index, nearest.z + (hinge.layer ?? 0) * 0.015);
          }
          geometry.computeVertexNormals();
          const color = hinge.side === "back" ? "#8bb6c7" : "#f3ead3";
          const material = new THREE.MeshStandardMaterial({
            color,
            side: THREE.DoubleSide,
            roughness: 0.72,
            metalness: 0,
            transparent: true,
            opacity: state.opacity,
            emissive: selectedId === object.id ? "#7a5420" : "#000000",
          });
          root.add(new THREE.Mesh(geometry, material));
        } else if (
          data.kind === "crease" ||
          data.kind === "segment" ||
          data.kind === "arrow"
        ) {
          const points = [
            new THREE.Vector3(data.start.x, -data.start.y, 0.04),
            new THREE.Vector3(data.end.x, -data.end.y, 0.04),
          ];
          root.add(
            new THREE.Line(
              new THREE.BufferGeometry().setFromPoints(points),
              new THREE.LineBasicMaterial({
                color: data.kind === "crease" ? "#ed765e" : "#89a7c2",
                transparent: true,
                opacity: state.opacity,
              }),
            ),
          );
        }
      }
      if (!scene.getObjectByName("ambient")) {
        const ambient = new THREE.HemisphereLight(0xffffff, 0x263442, 2.2);
        ambient.name = "ambient";
        scene.add(ambient);
        const light = new THREE.DirectionalLight(0xffffff, 2.8);
        light.position.set(5, -5, 12);
        scene.add(light);
      }
    },
    camera: cameraPreset,
    reset: () => cameraPreset("presentation"),
    dispose() {
      cancelAnimationFrame(animation);
      observer.disconnect();
      controls.dispose();
      root.traverse(disposeObject);
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
