import { useEffect, useMemo, useState } from "react";
import type { RenderDocumentV2 } from "../../domain/render/types";
import {
  cancelRender,
  readRender,
  startRender,
  startSessionRender,
  videoUrl,
  type RenderJob,
} from "./renderClient";
import type { OrigamiSession } from "../../domain/origami/session";

const phaseText: Record<string, string> = {
  received: "Request received",
  "validating-document": "Checking the construction",
  "waiting-for-renderer": "Waiting for the video renderer",
  "preparing-scene": "Preparing the animation",
  "rendering-and-encoding": "Rendering and encoding the video",
  "stopping-renderer": "Stopping the render",
  complete: "Video ready",
  cancelled: "Render cancelled",
  failed: "Render failed",
};

const phaseProgress: Record<string, number> = {
  received: 10,
  "validating-document": 25,
  "waiting-for-renderer": 35,
  "preparing-scene": 45,
  "rendering-and-encoding": 75,
  complete: 100,
};

export function ManimExportPanel({
  document,
  session,
}: {
  document: RenderDocumentV2;
  session?: OrigamiSession;
}) {
  const [quality, setQuality] = useState<"draft" | "standard" | "high">(
    "standard",
  );
  const [foldMode, setFoldMode] = useState<"flat" | "hinge">("flat");
  const [job, setJob] = useState<RenderJob>();
  const [error, setError] = useState<string>();
  const hasFold = useMemo(
    () => document.revealActions.some(({ animation }) => animation === "fold"),
    [document],
  );
  const active =
    job && ["queued", "running", "cancelling"].includes(job.status);

  useEffect(() => {
    if (!active || !job) return;
    const timer = window.setTimeout(() => {
      void readRender(job.id)
        .then((next) => {
          setJob(next);
          if (next.status === "failed")
            setError(next.error ?? "The render failed.");
        })
        .catch(() => {
          setError("The local video renderer stopped responding.");
          setJob((current) =>
            current
              ? { ...current, status: "failed", phase: "failed" }
              : current,
          );
        });
    }, 600);
    return () => window.clearTimeout(timer);
  }, [active, job]);

  const start = async () => {
    setError(undefined);
    setJob(undefined);
    try {
      setJob(
        await (session
          ? startSessionRender(session, { quality, foldMode })
          : startRender(document, { quality, foldMode })),
      );
    } catch {
      setError(
        "The local video renderer is not available. Your construction is unchanged, and JSON or SVG export still works.",
      );
    }
  };

  return (
    <section className="video-export" aria-labelledby="video-export-title">
      <div>
        <p className="section-label">Optional video</p>
        <h2 id="video-export-title">Render an MP4</h2>
        <p>
          Turn this exact construction and reveal sequence into a shareable
          video.
        </p>
      </div>
      <div className="video-export-controls">
        <label>
          Quality
          <select
            value={quality}
            onChange={(event) =>
              setQuality(event.target.value as typeof quality)
            }
            disabled={Boolean(active)}
          >
            <option value="draft">Draft</option>
            <option value="standard">Standard</option>
            <option value="high">High</option>
          </select>
        </label>
        {hasFold && (
          <label>
            Fold style
            <select
              value={foldMode}
              onChange={(event) =>
                setFoldMode(event.target.value as typeof foldMode)
              }
              disabled={Boolean(active)}
            >
              <option value="flat">Flat</option>
              <option value="hinge">3D hinge</option>
            </select>
          </label>
        )}
        <button
          type="button"
          onClick={() => void start()}
          disabled={Boolean(active)}
        >
          {active ? "Rendering…" : "Render MP4"}
        </button>
        {active && job && (
          <button
            type="button"
            onClick={() =>
              void cancelRender(job.id)
                .then(setJob)
                .catch(() => setError("The renderer could not be stopped."))
            }
          >
            Cancel
          </button>
        )}
      </div>
      {job && (
        <div className="video-export-status" aria-live="polite">
          <progress
            max="100"
            value={phaseProgress[job.phase] ?? 5}
            aria-label="Video render progress"
          />
          <span>{phaseText[job.phase] ?? "Working…"}</span>
        </div>
      )}
      {error && (
        <p className="video-export-error" role="alert">
          {error}
        </p>
      )}
      {job?.status === "complete" && (
        <div className="video-export-result">
          <a href={videoUrl(job)} download>
            Download MP4
          </a>
          {job.outputPath && (
            <p>
              Saved locally to <code>{job.outputPath}</code>
            </p>
          )}
        </div>
      )}
    </section>
  );
}
