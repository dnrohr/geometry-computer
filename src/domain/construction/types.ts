export type ConstructionOpKind =
  | "given"
  | "constant"
  | "add"
  | "sub"
  | "mul"
  | "div"
  | "square"
  | "sqrt";

export type ConstructionNode = {
  id: string;
  kind: ConstructionOpKind;
  label: string;
  expressionLatex: string;
  inputs: string[];
  output: string;
  assumptions?: string[];
};

export type ConstructionStep = {
  id: string;
  parentStepId?: string;
  level: "macro" | "primitive";
  title: string;
  summary: string;
  operation?: ConstructionOpKind;
  inputObjectIds: string[];
  outputObjectIds: string[];
  createdObjectIds: string[];
  proofId?: string;
};

export type RevealAction = {
  id: string;
  stepId: string;
  objectId: string;
  start: number;
  end: number;
  animation:
    | "draw"
    | "fade-in"
    | "fade-out"
    | "pulse"
    | "highlight"
    | "select"
    | "dim";
};

export type ProofClaim = {
  id: string;
  text: string;
  mathLatex?: string;
  highlightObjectIds: string[];
};

export type OperationProof = {
  id: string;
  title: string;
  operation: ConstructionOpKind;
  intuition: string;
  givens: string[];
  claims: ProofClaim[];
  conclusion: string;
  assumptions?: string[];
};

export type ConstructionTrace = {
  nodes: ConstructionNode[];
  steps: ConstructionStep[];
  revealActions: RevealAction[];
  proofs: OperationProof[];
};
