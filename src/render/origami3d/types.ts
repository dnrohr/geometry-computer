import type { RenderDocumentV2 } from "../../domain/render/types";

export type CameraPreset = "presentation" | "top" | "side";
export type Origami3DAdapter = {
  update: (document: RenderDocumentV2, time: number, selectedId?: string) => void;
  camera: (preset: CameraPreset) => void;
  reset: () => void;
  dispose: () => void;
};
