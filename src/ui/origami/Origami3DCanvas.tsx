import { useEffect, useRef, useState } from "react";
import type { RenderDocumentV2 } from "../../domain/render/types";
import type {
  CameraPreset,
  Origami3DAdapter,
} from "../../render/origami3d/types";

const browserHasWebGL = () =>
  typeof window !== "undefined" &&
  ("WebGL2RenderingContext" in window || "WebGLRenderingContext" in window);

export function Origami3DCanvas({
  document,
  time,
  selectedId,
  forceUnavailable = false,
}: {
  document: RenderDocumentV2;
  time: number;
  selectedId?: string;
  forceUnavailable?: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const adapter = useRef<Origami3DAdapter | undefined>(undefined);
  const [error, setError] = useState<string>();
  const latest = useRef({ document, time, selectedId });
  const available = !forceUnavailable && browserHasWebGL();
  const multiFaceCollision =
    document.revealActions.filter(({ animation }) => animation === "fold")
      .length > 1;
  const canRender = available && !multiFaceCollision;
  useEffect(() => {
    if (!canRender || !container.current) return;
    let disposed = false;
    void import("../../render/origami3d/threeAdapter")
      .then(({ createThreeOrigamiAdapter }) => {
        if (!disposed && container.current) {
          adapter.current = createThreeOrigamiAdapter(container.current);
          adapter.current.update(
            latest.current.document,
            latest.current.time,
            latest.current.selectedId,
          );
        }
      })
      .catch(() => setError("The 3D renderer could not start."));
    return () => {
      disposed = true;
      adapter.current?.dispose();
      adapter.current = undefined;
    };
  }, [canRender]);
  useEffect(() => {
    adapter.current?.update(document, time, selectedId);
  }, [document, selectedId, time]);
  useEffect(() => {
    latest.current = { document, time, selectedId };
  }, [document, selectedId, time]);
  if (!available || error || multiFaceCollision)
    return (
      <div className="origami-3d-fallback" role="status">
        <strong>3D preview unavailable</strong>
        <p>
          {multiFaceCollision
            ? "This multi-face fold requires collision handling that the browser preview does not support yet. Continue in the exact 2D fold view."
            : (error ??
              "This browser or graphics configuration does not provide WebGL. Continue in the exact 2D fold view.")}
        </p>
      </div>
    );
  const camera = (preset: CameraPreset) => adapter.current?.camera(preset);
  return (
    <div className="origami-3d">
      <div
        ref={container}
        className="origami-3d-viewport"
        aria-label={`${document.metadata.title} interactive 3D fold`}
        role="img"
      />
      <div className="origami-camera-controls" aria-label="3D camera controls">
        <button type="button" onClick={() => camera("presentation")}>
          Presentation
        </button>
        <button type="button" onClick={() => camera("top")}>
          Top
        </button>
        <button type="button" onClick={() => camera("side")}>
          Side
        </button>
        <button type="button" onClick={() => adapter.current?.reset()}>
          Reset camera
        </button>
        <span>Drag to orbit · scroll to zoom</span>
      </div>
    </div>
  );
}
