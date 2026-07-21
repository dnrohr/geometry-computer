import { compileOrigamiFunctionPreview } from "./functionPreview";
import {
  origamiFunctionChallenges,
  origamiFunctionExamples,
} from "./functionExamples";

describe("origami function examples", () => {
  it("provides F1.1 examples with function-signature display text", () => {
    expect(
      origamiFunctionExamples.map(({ displaySource }) => displaySource),
    ).toEqual(["f(a,b)=a*b", "f(x)=sqrt(x+1)", "f(a,b,c)=(a+b)/(c+1)"]);
  });

  it("keeps every preset compilable through the signature-aware boundary", () => {
    const previews = origamiFunctionExamples.map((example) =>
      compileOrigamiFunctionPreview(example.displaySource, example.values),
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

  it("provides curated F7.5 challenges with compiler-backed fold counts", () => {
    expect(
      origamiFunctionChallenges.map(
        ({ title, displaySource, expectedFoldCount }) => ({
          title,
          displaySource,
          expectedFoldCount,
        }),
      ),
    ).toEqual([
      {
        title: "Make 2a + b",
        displaySource: "f(a,b)=2*a+b",
        expectedFoldCount: 15,
      },
      {
        title: "Scaled reciprocal",
        displaySource: "f(a,b)=a/(b+1)",
        expectedFoldCount: 15,
      },
      {
        title: "Extract sqrt(a+1)",
        displaySource: "f(a)=sqrt(a+1)",
        expectedFoldCount: 14,
      },
    ]);

    const previews = origamiFunctionChallenges.map((challenge) =>
      compileOrigamiFunctionPreview(challenge.displaySource, challenge.values),
    );

    expect(previews.every(({ status }) => status === "compiled")).toBe(true);
    expect(
      previews.map((preview, index) =>
        preview.status === "compiled"
          ? preview.plan.phases.length
          : origamiFunctionChallenges[index].expectedFoldCount,
      ),
    ).toEqual(
      origamiFunctionChallenges.map(
        ({ expectedFoldCount }) => expectedFoldCount,
      ),
    );
  });
});
