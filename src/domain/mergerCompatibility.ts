export type SharedInterfaceCandidate =
  | "function-plan"
  | "proof-card"
  | "export"
  | "expression-control";

export type CompatibilityGate = {
  candidate: SharedInterfaceCandidate;
  status: "blocked-until-tested";
  compassEvidence: string;
  origamiEvidence: string;
  requiredCompatibilityTest: string;
};

export type ConstructionSystemSelectorCapability =
  | "compute"
  | "render"
  | "inspect"
  | "prove"
  | "export";

export type ConstructionSystemSelectorReadiness = {
  status: "ready" | "not-ready";
  commonFunctionFamily: string;
  requiredCapabilities: ConstructionSystemSelectorCapability[];
  missingEvidence: Record<ConstructionSystemSelectorCapability, string>;
  decision: string;
};

export type SeparateTabDecision = {
  status: "keep-separate";
  protectedWorkflows: string[];
  mergeRisks: string[];
  decision: string;
};

export const mergerCompatibilityGates: CompatibilityGate[] = [
  {
    candidate: "function-plan",
    status: "blocked-until-tested",
    compassEvidence:
      "Compass plans must prove operation order, macro/primitive step links, object provenance, and reveal actions.",
    origamiEvidence:
      "Origami plans must prove node order, operation phases, fold certificates, solver readiness, and result extraction.",
    requiredCompatibilityTest:
      "A shared function-plan interface needs one test that compiles the same function through both systems and asserts the shared fields without hiding system-specific details.",
  },
  {
    candidate: "proof-card",
    status: "blocked-until-tested",
    compassEvidence:
      "Compass proof cards must prove Euclidean macro assumptions, givens, claims, highlighted objects, and conclusions.",
    origamiEvidence:
      "Origami proof cards must prove fold claims, fold certificates, branch choices, fallback status, and highlighted crease objects.",
    requiredCompatibilityTest:
      "A shared proof-card interface needs paired tests that open a compass proof and an origami proof for the same arithmetic family.",
  },
  {
    candidate: "export",
    status: "blocked-until-tested",
    compassEvidence:
      "Compass exports must prove JSON scene data, visible SVG export, and clean final SVG export.",
    origamiEvidence:
      "Origami exports must prove function-animation JSON, replay, current/final SVG snapshots, crease-pattern SVG, and animated SVG.",
    requiredCompatibilityTest:
      "A shared export interface needs schema tests for both export families and browser smoke coverage for both download flows.",
  },
  {
    candidate: "expression-control",
    status: "blocked-until-tested",
    compassEvidence:
      "Compass expression controls must prove expression input, sample variables, gallery loading, validation, and compile behavior.",
    origamiEvidence:
      "Origami expression controls must prove function signatures, allowable-field validation, variable controls, examples, challenges, and share text.",
    requiredCompatibilityTest:
      "A shared expression-control interface needs UI tests that exercise both workspaces without removing either system's labels or validation states.",
  },
];

export const compatibilityGateFor = (
  candidate: SharedInterfaceCandidate,
): CompatibilityGate | undefined =>
  mergerCompatibilityGates.find((gate) => gate.candidate === candidate);

export const constructionSystemSelectorReadiness: ConstructionSystemSelectorReadiness =
  {
    status: "not-ready",
    commonFunctionFamily: "sqrt(a+1)",
    requiredCapabilities: ["compute", "render", "inspect", "prove", "export"],
    missingEvidence: {
      compute:
        "Both systems compute sqrt(a+1), but the origami function lab still carries fallback fold-solver phases.",
      render:
        "Both systems render results, but compass construction rendering and origami fold animation explain different intermediate geometry.",
      inspect:
        "Both systems expose inspectable objects, but a shared selector would need paired object-inspector expectations for the same function family.",
      prove:
        "Both systems expose proof evidence, but compass proof cards and origami fold certificates are not yet parity-tested through one shared workflow.",
      export:
        "Both systems export data, but compass scene exports and origami animation/replay exports use intentionally different schemas.",
    },
    decision:
      "Keep the existing separate tabs. Do not introduce a construction-system selector until all required capabilities have paired parity tests.",
  };

export const isConstructionSystemSelectorReady = (
  readiness = constructionSystemSelectorReadiness,
) =>
  readiness.status === "not-ready"
    ? false
    : readiness.requiredCapabilities.every(
        (capability) => readiness.missingEvidence[capability] === "",
      );

export const separateTabDecision: SeparateTabDecision = {
  status: "keep-separate",
  protectedWorkflows: [
    "Fold animation playback with phase IDs, speed, reduced motion, fold camera, onion-skin ghosts, visual cues, minimap, and presentation mode.",
    "Two-sided paper styling with front/back colors, patterns, opacity, palette randomizer, crease color, highlight color, and replay/export metadata.",
    "Compass-and-straightedge construction workflow with expression input, construction diagram, step list, object inspector, proof cards, reveal controls, and clean SVG export.",
  ],
  mergeRisks: [
    "A shared workspace would make fold animation compete with compass reveal controls for timeline meaning.",
    "A shared styling panel would blur origami front/back paper semantics with compass construction visual hierarchy.",
    "A merged inspector would either hide fold-specific solver readiness or force compass users through irrelevant paper state.",
  ],
  decision:
    "Keep the flat-origami function lab in a separate tab until a merge can preserve fold animation clarity, paper-side styling, and the original compass-and-straightedge workflow.",
};
