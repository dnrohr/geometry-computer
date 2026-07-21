import {
  mergerConcepts,
  mergerConceptsByCategory,
  type MergerConceptCategory,
} from "./mergerConcepts";

describe("merger concept classifications", () => {
  it("classifies concepts as shared, similar, or system-specific", () => {
    const categories: MergerConceptCategory[] = [
      "shared",
      "similar",
      "system-specific",
    ];

    expect(new Set(mergerConcepts.map(({ category }) => category))).toEqual(
      new Set(categories),
    );
    for (const category of categories) {
      expect(mergerConceptsByCategory(category).length).toBeGreaterThanOrEqual(
        5,
      );
    }
  });

  it("keeps folding and compass explanation concepts out of the shared bucket", () => {
    expect(
      mergerConceptsByCategory("shared").map(({ concept }) => concept),
    ).toEqual([
      "Parsed expression AST",
      "Sampled numeric values",
      "Arithmetic operation family names",
      "Result expression provenance",
      "JSON-safe generated data",
    ]);

    expect(
      mergerConceptsByCategory("system-specific").map(({ concept }) => concept),
    ).toEqual(
      expect.arrayContaining([
        "Huzita-Hatori axiom selection",
        "Mountain/valley assignment and side exposure",
        "Compass construction scaffolding",
        "Origami function animation controls",
        "Physical fold solver backlog",
      ]),
    );
  });
});
