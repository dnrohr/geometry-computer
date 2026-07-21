import { readFileSync } from "node:fs";
import { compileExpression } from "./compiler/compileExpression";
import { constructionJson } from "./export/exportConstruction";
import {
  compileOrigamiFunctionPreview,
  origamiFunctionAnimationExport,
} from "./origami/function";
import { mergerConcepts } from "./mergerConcepts";
import { parseExpression } from "./parser/parseExpression";
import { compileOrigamiExpression } from "./origami/compiler/compileOrigamiExpression";

describe("origami and compass-straightedge merger readiness", () => {
  it("compares addition traces without requiring a shared compiler abstraction", () => {
    const ast = parseExpression("a+b");
    const values = { a: 3, b: 2 };
    const compass = compileExpression(ast, values, "a+b", "a+b");
    const origami = compileOrigamiExpression(ast, values, "a+b");

    expect(compass.value).toBe(5);
    expect(origami.value).toBe(5);
    expect(compass.ast).toEqual(origami.ast);
    expect(compass.steps.some(({ operation }) => operation === "add")).toBe(
      true,
    );
    expect(origami.steps.some(({ operation }) => operation === "add")).toBe(
      true,
    );
    expect(compass.objects.find(({ role }) => role === "result")).toMatchObject(
      {
        represents: "a + b",
      },
    );
    expect(origami.objects.find(({ role }) => role === "result")).toMatchObject(
      {
        provenance: { expression: "a + b" },
      },
    );
    const compassObjectIds = new Set(compass.objects.map(({ id }) => id));
    const sharedObjectIds = origami.objects
      .map(({ id }) => id)
      .filter((id) => compassObjectIds.has(id));
    expect(sharedObjectIds).toEqual([]);
  });

  it("compares function-lab data without collapsing separate timeline and export models", () => {
    const ast = parseExpression("sqrt(a+1)");
    const values = { a: 3 };
    const compass = compileExpression(ast, values, "sqrt(a+1)", "sqrt(a+1)");
    const origami = compileOrigamiFunctionPreview("f(a)=sqrt(a+1)", values);

    expect(origami.status).toBe("compiled");
    if (origami.status !== "compiled") return;

    expect(compass.value).toBe(2);
    expect(origami.input.validation.value).toBe(2);
    expect(compass.ast).toEqual(origami.plan.source.ast);
    expect(compass.expression).toBe("sqrt(a+1)");
    expect(origami.plan.source.source).toBe("f(a) = sqrt(a + 1)");

    expect(compass.steps.some(({ operation }) => operation === "sqrt")).toBe(
      true,
    );
    expect(
      origami.plan.operations.some(
        ({ kind }) => kind === "extract-square-root",
      ),
    ).toBe(true);
    expect(compass.proofs.some(({ operation }) => operation === "sqrt")).toBe(
      true,
    );
    expect(
      origami.plan.phases.some(({ foldCertificate }) => foldCertificate),
    ).toBe(true);

    const compassResult = compass.objects.find(({ role }) => role === "result");
    expect(compassResult).toMatchObject({ represents: "sqrt(a + 1)" });
    expect(origami.plan.resultObjectId).toBe(
      origami.plan.resultExtraction.outputObjectId,
    );

    expect(JSON.parse(constructionJson(compass))).toMatchObject({
      expression: "sqrt(a+1)",
      values,
      objects: expect.any(Array),
      steps: expect.any(Array),
    });
    expect(origamiFunctionAnimationExport(origami)).toMatchObject({
      version: 1,
      animation: {
        phaseId: "origami-function-phase-1",
        playing: false,
      },
      solverReadiness: {
        totalPhases: 14,
      },
    });

    expect(compass.revealActions.length).toBeGreaterThan(0);
    expect(origami.plan.phases).toHaveLength(14);
    expect(origami.animation.planId).toBe(origami.plan.id);
  });

  it("documents every F8.1 comparison category before shared abstractions", () => {
    const review = readFileSync("docs/ORIGAMI_MERGER_REVIEW.md", "utf8");

    for (const heading of [
      "Function Parsing and Expression Normalization",
      "Sampled Values",
      "Operation Traces",
      "Proof Claims",
      "Object Provenance",
      "Exports",
      "Animation Timelines",
    ]) {
      expect(review).toContain(`### ${heading}`);
    }
    expect(review).toContain(
      "Do not merge the compiler, renderer, export, or proof paths yet.",
    );
  });

  it("keeps the written concept classification aligned with F8.2 data", () => {
    const review = readFileSync("docs/ORIGAMI_MERGER_REVIEW.md", "utf8");
    const normalizedReview = review.replace(/\s+/g, " ");

    for (const { concept, reason } of mergerConcepts) {
      expect(review).toContain(concept);
      expect(normalizedReview).toContain(reason);
    }
  });
});
