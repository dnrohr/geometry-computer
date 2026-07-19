import { compileOrigamiFunctionPreview } from "./functionPreview";
import { origamiFunctionExamples } from "./functionExamples";

describe("origami function examples", () => {
  it("provides F1.1 examples with function-signature display text", () => {
    expect(
      origamiFunctionExamples.map(({ displaySource }) => displaySource),
    ).toEqual(["f(a,b)=a*b", "f(x)=sqrt(x+1)", "f(a,b,c)=(a+b)/(c+1)"]);
  });

  it("keeps every preset compilable through the current expression-body boundary", () => {
    const previews = origamiFunctionExamples.map((example) =>
      compileOrigamiFunctionPreview(example.expression, example.values),
    );

    expect(previews.every(({ status }) => status === "compiled")).toBe(true);
    expect(
      previews.map((preview) =>
        preview.status === "compiled"
          ? preview.input.validation.value
          : undefined,
      ),
    ).toEqual([6, 2, 2.5]);
  });
});
