export type MergerConceptCategory = "shared" | "similar" | "system-specific";

export type MergerConcept = {
  category: MergerConceptCategory;
  concept: string;
  reason: string;
};

export const mergerConcepts: MergerConcept[] = [
  {
    category: "shared",
    concept: "Parsed expression AST",
    reason:
      "Both systems already consume the same parser output before choosing a construction model.",
  },
  {
    category: "shared",
    concept: "Sampled numeric values",
    reason:
      "Both compilers use sample values to evaluate the expression and validate expected results.",
  },
  {
    category: "shared",
    concept: "Arithmetic operation family names",
    reason:
      "Operation families such as addition and square root stay comparable in tests and docs.",
  },
  {
    category: "shared",
    concept: "Result expression provenance",
    reason:
      "Both systems tie the displayed result back to a formatted expression.",
  },
  {
    category: "shared",
    concept: "JSON-safe generated data",
    reason:
      "Both paths can serialize generated scenes or function previews without UI-only state.",
  },
  {
    category: "similar",
    concept: "Step and phase models",
    reason:
      "Compass steps describe macro and primitive construction levels; origami phases describe fold computation and solver readiness.",
  },
  {
    category: "similar",
    concept: "Proof references",
    reason:
      "Compass proof cards and origami fold certificates both justify work, but they cite different mathematical objects.",
  },
  {
    category: "similar",
    concept: "Object provenance fields",
    reason:
      "Both preserve provenance, while compass and origami object namespaces and metadata differ.",
  },
  {
    category: "similar",
    concept: "Progressive visual state",
    reason:
      "Compass reveal progress and origami fold playback are deterministic, but they explain different actions.",
  },
  {
    category: "similar",
    concept: "Export controls",
    reason:
      "Both expose JSON and SVG-style exports, while their schemas and replay semantics remain different.",
  },
  {
    category: "system-specific",
    concept: "Huzita-Hatori axiom selection",
    reason:
      "Fold axiom choice and branch ordering only belong to the origami solver path.",
  },
  {
    category: "system-specific",
    concept: "Mountain/valley assignment and side exposure",
    reason:
      "Paper orientation is essential to folds and has no compass-and-straightedge equivalent.",
  },
  {
    category: "system-specific",
    concept: "Compass construction scaffolding",
    reason:
      "Circles, rays, arcs, triangles, and clean final extraction are Euclidean construction concerns.",
  },
  {
    category: "system-specific",
    concept: "Origami function animation controls",
    reason:
      "Fold camera, onion-skin ghosts, cues, minimap, presentation mode, replay, and paper palettes explain folding-specific computation.",
  },
  {
    category: "system-specific",
    concept: "Physical fold solver backlog",
    reason:
      "Fallback phases and required fold-solver capabilities are origami-only readiness data.",
  },
];

export const mergerConceptsByCategory = (
  category: MergerConceptCategory,
): MergerConcept[] =>
  mergerConcepts.filter((concept) => concept.category === category);
