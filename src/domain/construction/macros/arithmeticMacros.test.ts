import { compileExpression } from "../../compiler/compileExpression";
import { parseExpression } from "../../parser/parseExpression";

const compile = (source: string, values: Record<string, number>) =>
  compileExpression(parseExpression(source), values);

describe("canonical arithmetic macro traces", () => {
  it.each([
    ["a+b", { a: 3, b: 2 }, "add", 5],
    ["a-b", { a: 3, b: 5 }, "sub", -2],
    ["a*b", { a: 3, b: 2 }, "mul", 6],
    ["a/b", { a: 6, b: 2 }, "div", 3],
    ["a^2", { a: 3 }, "square", 9],
    ["sqrt(a)", { a: 4 }, "sqrt", 2],
  ] as const)("generates %s", (source, values, operation, expected) => {
    const scene = compile(source, values);
    const macro = scene.steps.find((step) => step.operation === operation);
    expect(scene.value).toBeCloseTo(expected);
    expect(macro).toBeDefined();
    expect(
      scene.steps.some(
        (step) => step.level === "primitive" && step.parentStepId === macro?.id,
      ),
    ).toBe(true);
    expect(macro?.proofId).toBe(`proof-${operation}`);
  });

  it("draws negative subtraction as a left-directed segment", () => {
    const scene = compile("a-b", { a: 2, b: 5 });
    const result = scene.objects.find(({ role }) => role === "result");
    expect(result?.data.kind).toBe("segment");
    if (result?.data.kind === "segment")
      expect(result.data.end.x).toBeLessThan(result.data.start.x);
  });

  it("creates the similar-triangle intersection and result extraction", () => {
    const scene = compile("a*b", { a: 2, b: 4 });
    expect(scene.objects.some(({ kind }) => kind === "ray")).toBe(true);
    expect(
      scene.objects.filter(({ kind }) => kind === "triangle"),
    ).toHaveLength(2);
    expect(
      scene.objects.some(
        ({ represents }) => represents === "constructed endpoint",
      ),
    ).toBe(true);
    expect(
      scene.steps.some(({ title }) => /extract the result/i.test(title)),
    ).toBe(true);
  });

  it("creates the geometric-mean semicircle and selected branch", () => {
    const scene = compile("sqrt(a)", { a: 9 });
    expect(
      scene.objects.some(({ represents }) => represents === "unit length"),
    ).toBe(true);
    expect(
      scene.objects.some(({ represents }) => represents === "radicand length"),
    ).toBe(true);
    expect(scene.objects.some(({ kind }) => kind === "arc")).toBe(true);
    expect(
      scene.objects.some(({ represents }) =>
        represents?.includes("upper semicircle intersection"),
      ),
    ).toBe(true);
    const semicircle = scene.objects.find(({ kind }) => kind === "arc")!;
    expect(
      scene.revealActions.find(({ objectId }) => objectId === semicircle.id)
        ?.animation,
    ).toBe("fade-in");
  });

  it("links every object to reveal and provenance data", () => {
    const scene = compile("(a+b)*b", { a: 2, b: 3 });
    const reveals = new Set(
      scene.revealActions.map(({ objectId }) => objectId),
    );
    expect(scene.objects.every(({ id }) => reveals.has(id))).toBe(true);
    expect(
      scene.objects
        .filter(({ role, kind }) => role === "input" && kind === "segment")
        .every(({ usedByStepIds }) => usedByStepIds.length > 0),
    ).toBe(true);
    const objectIds = new Set(scene.objects.map(({ id }) => id));
    scene.proofs.forEach((proof) =>
      proof.claims.forEach((claim) =>
        expect(claim.highlightObjectIds.every((id) => objectIds.has(id))).toBe(
          true,
        ),
      ),
    );
  });

  it("keeps diagram labels symbolic and vertex names invisible", () => {
    const scenes = [
      compile("a+b", { a: 3, b: 2 }),
      compile("a*b", { a: 3, b: 2 }),
      compile("sqrt(a)", { a: 4 }),
    ];
    scenes.forEach((scene) => {
      const diagramLabels = scene.objects
        .filter(({ kind }) => kind === "label")
        .map(({ data }) => (data.kind === "label" ? data.text : ""));
      expect(diagramLabels.every((text) => !text.includes(" = "))).toBe(true);
      expect(
        scene.objects
          .filter(({ kind }) => kind === "point")
          .every(({ label }) => label === undefined),
      ).toBe(true);
    });
    expect(
      scenes[0].objects.some(
        ({ data }) => data.kind === "label" && data.text === "a + b",
      ),
    ).toBe(true);
  });

  it("explains the geometric mean without relying on vertex names", () => {
    const proof = compile("sqrt(a)", { a: 4 }).proofs.find(
      ({ operation }) => operation === "sqrt",
    );
    expect(proof?.claims[0].text).toMatch(/altitude theorem/i);
    expect(proof?.claims[0].mathLatex).toBe("h²=1·x");
    expect(proof?.conclusion).toContain("h = √x");
  });
});
