import type { RenderDocumentV2 } from "../../domain/render/types";
import type { OrigamiSession } from "../../domain/origami/session";

export const MANIM_SERVICE_URL = "http://127.0.0.1:8765";

export type RenderJob = {
  id: string;
  status:
    | "queued"
    | "running"
    | "cancelling"
    | "cancelled"
    | "failed"
    | "complete";
  phase: string;
  error?: string;
  outputPath?: string;
  videoUrl?: string;
};

async function request(path: string, init?: RequestInit): Promise<RenderJob> {
  const response = await fetch(`${MANIM_SERVICE_URL}${path}`, init);
  const payload = (await response.json()) as RenderJob & { error?: string };
  if (!response.ok)
    throw new Error(
      payload.error ?? "The video renderer rejected the request.",
    );
  return payload;
}

export const startRender = (
  document: RenderDocumentV2,
  settings: {
    quality: "draft" | "standard" | "high";
    foldMode: "flat" | "hinge";
  },
) =>
  request("/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ document, settings }),
  });

export const startSessionRender = (
  session: OrigamiSession,
  settings: { quality: "draft" | "standard" | "high"; foldMode: "flat" | "hinge" },
) => request("/jobs", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ session, settings }),
});

export const readRender = (id: string) => request(`/jobs/${id}`);
export const cancelRender = (id: string) =>
  request(`/jobs/${id}`, { method: "DELETE" });
export const videoUrl = (job: RenderJob) =>
  job.videoUrl ? `${MANIM_SERVICE_URL}${job.videoUrl}` : undefined;
