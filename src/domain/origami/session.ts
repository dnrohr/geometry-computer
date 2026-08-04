import type { RenderDocumentV2 } from "../render/types";
import { compileGuidedFold, type GuidedFoldRequest } from "./guidedFold";
import { rectangularPaper } from "./paper";
import type { OrigamiExample } from "./examples";
import type { PaperModel } from "./types";

export type OrigamiSessionStep = {
  id: string;
  request: GuidedFoldRequest;
  example: OrigamiExample;
  document: RenderDocumentV2;
  start: number;
  end: number;
  paperAfter: PaperModel;
  provenance?: OrigamiStepProvenance;
};

export type OrigamiStepProvenance = {
  sessionStepId: string;
  expressionNodeId: string;
  expression: string;
  templateId: string;
  exactValue: string;
  polynomial: string[];
  isolatingInterval: { lower: string; upper: string };
  selectedCandidate: number;
  candidates: Array<{ index: number; rootParameter?: number; maxResidual: number; selected: boolean; reason?: string }>;
  proofClaims: Array<{ id: string; statement: string; justification: string; axiom?: string }>;
  creaseObjectIds: string[];
  objectIds: string[];
  physicalInstruction: string;
};

export type OrigamiSession = {
  version: 1;
  schema: "geometry-computer/origami-session";
  title: string;
  steps: OrigamiSessionStep[];
  duration: number;
};

export const emptyOrigamiSession = (title = "Origami session"): OrigamiSession => ({ version: 1, schema: "geometry-computer/origami-session", title, steps: [], duration: 0 });

export function appendSessionFold(session: OrigamiSession, request: GuidedFoldRequest): OrigamiSession {
  const paper = session.steps.at(-1)?.paperAfter ?? rectangularPaper(10, 6);
  const compiled = compileGuidedFold(request, paper);
  const start = session.duration;
  const end = start + compiled.document.metadata.duration;
  return { ...session, duration: end, steps: [...session.steps, { id: `session-fold-${session.steps.length + 1}`, request, ...compiled, start, end }] };
}

export function sessionPosition(session: OrigamiSession, requestedTime: number) {
  if (!session.steps.length) return undefined;
  const time = Math.max(0, Math.min(session.duration, requestedTime));
  const step = session.steps.find(({ end }) => time < end) ?? session.steps.at(-1)!;
  return { step, stepIndex: session.steps.indexOf(step), localTime: Math.max(0, Math.min(step.document.metadata.duration, time - step.start)) };
}

export function serializeOrigamiSession(session: OrigamiSession) {
  return JSON.stringify({ version: session.version, schema: session.schema, title: session.title, requests: session.steps.map(({ request }) => request), provenance: session.steps.map(({ provenance }) => provenance ?? null) }, null, 2);
}

export function parseOrigamiSession(source: string): OrigamiSession {
  const value: unknown = JSON.parse(source);
  if (!value || typeof value !== "object") throw new Error("Session JSON must be an object.");
  const record = value as Record<string, unknown>;
  if (record.version !== 1 || record.schema !== "geometry-computer/origami-session" || !Array.isArray(record.requests)) throw new Error("Unsupported or malformed origami session.");
  let session = emptyOrigamiSession(typeof record.title === "string" ? record.title : undefined);
  for (const [index, request] of record.requests.entries()) {
    session = appendSessionFold(session, request as GuidedFoldRequest);
    if (Array.isArray(record.provenance) && record.provenance[index]) {
      const steps = [...session.steps];
      steps[index] = { ...steps[index], provenance: record.provenance[index] as OrigamiStepProvenance };
      session = { ...session, steps };
    }
  }
  return session;
}

export const threeFoldReferenceRequests: GuidedFoldRequest[] = [
  { operation: "point-to-point", title: "Fold left to right", movingSide: "left", source: { x: 0, y: 3 }, target: { x: 10, y: 3 } },
  { operation: "through-point", title: "Fold across the center", movingSide: "right", through: { x: 5, y: 3 }, angle: 0 },
  { operation: "line-to-line", title: "Fold the corner axis", movingSide: "left", sourceAngle: 0, targetAngle: 90, branch: "internal" },
];

export function threeFoldReferenceSession() {
  return threeFoldReferenceRequests.reduce(appendSessionFold, emptyOrigamiSession("Three-fold reference"));
}
