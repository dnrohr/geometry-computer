export type OrigamiPoint = { x: number; y: number };

export type OrigamiLine = {
  point: OrigamiPoint;
  direction: OrigamiPoint;
};

export type OrigamiAxiomKind =
  | "point-to-point"
  | "point-to-line"
  | "line-to-line"
  | "tangent-fold";

export type OrigamiArithmeticMacroKind =
  | "place-input"
  | "copy-length"
  | "constant"
  | "add"
  | "sub"
  | "mul"
  | "div"
  | "square"
  | "sqrt";

export type OrigamiFoldAssignment = "mountain" | "valley" | "unassigned";

export type OrigamiObjectKind =
  | "paper-boundary"
  | "point"
  | "line"
  | "crease"
  | "segment"
  | "reflected-point"
  | "label";

export type OrigamiObjectRole =
  | "paper"
  | "input"
  | "crease"
  | "reflection"
  | "intermediate"
  | "result"
  | "annotation";

export type OrigamiDegeneracyKind =
  | "coincident-points"
  | "parallel-lines"
  | "ambiguous-solutions"
  | "no-solution"
  | "fold-outside-paper";

export type OrigamiDegeneracy = {
  kind: OrigamiDegeneracyKind;
  message: string;
  objectIds: string[];
};

export type OrigamiProvenance = {
  expressionNodeId?: string;
  expression?: string;
  macroId?: string;
  foldStepId?: string;
  proofClaimIds?: string[];
  sourceObjectIds: string[];
};

export type OrigamiMacroBranchSelection = {
  id: string;
  label: string;
  selected: boolean;
  reason: string;
};

export type OrigamiArithmeticMacroTrace = {
  macroId: string;
  operation: OrigamiArithmeticMacroKind;
  sourceSegmentObjectIds: string[];
  unitReferenceObjectIds: string[];
  guideLineObjectIds: string[];
  foldCreaseObjectIds: string[];
  reflectedObjectIds: string[];
  selectedIntersectionObjectIds: string[];
  resultSegmentObjectIds: string[];
  proofClaimIds: string[];
  branchSelections: OrigamiMacroBranchSelection[];
  degeneracyObjectIds: string[];
};

type OrigamiObjectData =
  | {
      kind: "paper-boundary";
      points: [OrigamiPoint, OrigamiPoint, OrigamiPoint, OrigamiPoint];
    }
  | { kind: "point"; position: OrigamiPoint }
  | { kind: "line"; line: OrigamiLine }
  | {
      kind: "crease";
      line: OrigamiLine;
      assignment: OrigamiFoldAssignment;
      solutionId?: string;
    }
  | { kind: "segment"; start: OrigamiPoint; end: OrigamiPoint }
  | {
      kind: "reflected-point";
      originalObjectId: string;
      creaseObjectId: string;
      position: OrigamiPoint;
    }
  | { kind: "label"; position: OrigamiPoint; text: string };

export type OrigamiObject = {
  id: string;
  kind: OrigamiObjectKind;
  role: OrigamiObjectRole;
  label?: string;
  createdByStepId?: string;
  usedByStepIds: string[];
  dependsOnObjectIds: string[];
  provenance: OrigamiProvenance;
  data: OrigamiObjectData;
};

export type OrigamiObjectMetadata = Omit<OrigamiObject, "kind" | "data">;

export type OrigamiFoldStep = {
  id: string;
  title: string;
  summary: string;
  axiom?: OrigamiAxiomKind;
  operation?: OrigamiArithmeticMacroKind;
  macroTrace?: OrigamiArithmeticMacroTrace;
  inputObjectIds: string[];
  outputObjectIds: string[];
  createdObjectIds: string[];
  selectedSolutionId?: string;
  degeneracies?: OrigamiDegeneracy[];
  proofId?: string;
};

export type OrigamiRevealAction = {
  id: string;
  stepId: string;
  objectId: string;
  start: number;
  end: number;
  animation: "draw" | "fade-in" | "fade-out" | "highlight" | "dim";
};

export type OrigamiProofClaim = {
  id: string;
  text: string;
  mathLatex?: string;
  highlightObjectIds: string[];
};

export type OrigamiFoldProof = {
  id: string;
  title: string;
  axiom?: OrigamiAxiomKind;
  operation?: OrigamiArithmeticMacroKind;
  intuition: string;
  givens: string[];
  claims: OrigamiProofClaim[];
  conclusion: string;
  assumptions?: string[];
};

export type OrigamiFoldScene = {
  id: string;
  title: string;
  description?: string;
  objects: OrigamiObject[];
  steps: OrigamiFoldStep[];
  revealActions: OrigamiRevealAction[];
  proofs: OrigamiFoldProof[];
};

export function origamiObject(
  data: OrigamiObjectData,
  metadata: OrigamiObjectMetadata,
): OrigamiObject {
  return { ...metadata, kind: data.kind, data };
}

export const paperBoundaryObject = (
  points: [OrigamiPoint, OrigamiPoint, OrigamiPoint, OrigamiPoint],
  metadata: OrigamiObjectMetadata,
): OrigamiObject => origamiObject({ kind: "paper-boundary", points }, metadata);

export const pointObject = (
  position: OrigamiPoint,
  metadata: OrigamiObjectMetadata,
): OrigamiObject => origamiObject({ kind: "point", position }, metadata);

export const lineObject = (
  line: OrigamiLine,
  metadata: OrigamiObjectMetadata,
): OrigamiObject => origamiObject({ kind: "line", line }, metadata);

export const creaseObject = (
  line: OrigamiLine,
  assignment: OrigamiFoldAssignment,
  metadata: OrigamiObjectMetadata,
  solutionId?: string,
): OrigamiObject =>
  origamiObject({ kind: "crease", line, assignment, solutionId }, metadata);

export const segmentObject = (
  start: OrigamiPoint,
  end: OrigamiPoint,
  metadata: OrigamiObjectMetadata,
): OrigamiObject => origamiObject({ kind: "segment", start, end }, metadata);

export const reflectedPointObject = (
  originalObjectId: string,
  creaseObjectId: string,
  position: OrigamiPoint,
  metadata: OrigamiObjectMetadata,
): OrigamiObject =>
  origamiObject(
    { kind: "reflected-point", originalObjectId, creaseObjectId, position },
    metadata,
  );

export const labelObject = (
  position: OrigamiPoint,
  text: string,
  metadata: OrigamiObjectMetadata,
): OrigamiObject => origamiObject({ kind: "label", position, text }, metadata);
