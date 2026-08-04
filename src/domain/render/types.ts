import type {
  ConstructionStep,
  OperationProof,
  RevealAction,
} from "../construction/types";
import type { GeomObject, Point2 } from "../geometry/types";

export type RenderRole =
  | GeomObject["role"]
  | "paper"
  | "crease"
  | "reference"
  | "target";

export type OrigamiRenderObject = {
  id: string;
  kind: "polygon" | "crease" | "arrow";
  role: RenderRole;
  label?: string;
  createdByStepId: string;
  usedByStepIds: string[];
  represents?: string;
  dependsOnObjectIds: string[];
  data:
    | {
        kind: "polygon";
        points: Point2[];
        layer?: number;
        side?: "front" | "back";
      }
    | { kind: "crease" | "arrow"; start: Point2; end: Point2 };
};

export type RenderObject = GeomObject | OrigamiRenderObject;

export type FoldRenderAction = Omit<RevealAction, "animation"> & {
  animation: "fold" | "unfold";
  creaseObjectId: string;
  targetPoints: Point2[];
  movingSide: "left" | "right";
  targetLayer?: number;
  targetSide?: "front" | "back";
};

export type RenderAction = RevealAction | FoldRenderAction;

export type RenderMetadata = {
  schema: "geometry-computer/render-document";
  generator: { name: "geometry-computer"; version: string };
  title: string;
  narration?: string;
  aspectRatio: { width: number; height: number };
  theme: string;
  duration: number;
};

export type RenderDocumentV2 = {
  version: 2;
  metadata: RenderMetadata;
  expression: string;
  simplifiedExpression: string;
  values: Record<string, number>;
  viewBox: string;
  objects: RenderObject[];
  steps: ConstructionStep[];
  revealActions: RenderAction[];
  proofs: OperationProof[];
};

export type LegacyRenderDocumentV1 = Omit<
  RenderDocumentV2,
  "version" | "metadata"
> & {
  version: 1;
};

export type RenderDocument = RenderDocumentV2 | LegacyRenderDocumentV1;
