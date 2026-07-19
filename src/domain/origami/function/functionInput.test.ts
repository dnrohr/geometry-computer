import {
  DEFAULT_ORIGAMI_FUNCTION_VALUES,
  evaluateOrigamiFunctionInput,
} from "./functionInput";
import type {
  OrigamiFoldAnimationState,
  OrigamiFunctionAnimationExport,
  OrigamiFunctionPlan,
  OrigamiPaperStyle,
} from "./types";

describe("origami function input boundary", () => {
  it("parses and validates through an origami-owned function state", () => {
    const state = evaluateOrigamiFunctionInput("sqrt(a+1)");

    expect(state.status).toBe("valid");
    if (state.status !== "valid") throw new Error("Expected valid state");
    expect(state.validation.source).toMatchObject({
      expressionSource: "sqrt(a + 1)",
      functionName: "f",
      source: "f(a) = sqrt(a + 1)",
      variables: ["a"],
    });
    expect(state.validation.values).toEqual(DEFAULT_ORIGAMI_FUNCTION_VALUES);
    expect(state.validation.value).toBe(2);
  });

  it("keeps domain failures in the origami function boundary", () => {
    const state = evaluateOrigamiFunctionInput("a/(b-b)");

    expect(state.status).toBe("blocked");
    if (state.status !== "blocked") throw new Error("Expected blocked state");
    expect(state.validation.issues).toEqual([
      expect.objectContaining({
        code: "DIVISION_BY_ZERO",
        message: expect.stringMatching(/origami function domain/i),
      }),
    ]);
  });

  it("keeps parse failures in the origami function boundary", () => {
    const state = evaluateOrigamiFunctionInput("a@b");

    expect(state).toEqual({
      status: "parse-error",
      failure: {
        source: "a@b",
        error: "Expression contains an unsupported character.",
      },
    });
  });

  it("parses optional function signatures and preserves normalized result labels", () => {
    const state = evaluateOrigamiFunctionInput("g(a,b)=a*b");

    expect(state.status).toBe("valid");
    if (state.status !== "valid") throw new Error("Expected valid state");
    expect(state.validation.source).toMatchObject({
      expressionSource: "a * b",
      functionName: "g",
      signatureVariables: ["a", "b"],
      source: "g(a, b) = a * b",
      variables: ["a", "b"],
    });
    expect(state.validation.value).toBe(6);
  });

  it("defines origami-owned planning, animation, paper style, and export contracts", () => {
    const plan: OrigamiFunctionPlan = {
      id: "origami-function-plan-test",
      source: {
        ast: {
          kind: "add",
          left: { kind: "var", name: "a" },
          right: { kind: "var", name: "b" },
        },
        expressionSource: "a + b",
        functionName: "f",
        source: "f(a, b) = a + b",
        variables: ["a", "b"],
      },
      values: { a: 3, b: 2 },
      phases: [
        {
          id: "origami-phase-1",
          kind: "mark-input",
          expression: "a",
          sourceObjectIds: [],
          outputObjectIds: ["origami-segment-1"],
          proofClaimIds: [],
        },
      ],
      diagnostics: [],
      resultObjectId: "origami-segment-3",
    };
    const animation: OrigamiFoldAnimationState = {
      planId: plan.id,
      phaseId: "origami-phase-1",
      progress: 0.5,
      playing: false,
      speed: 1,
      reducedMotion: false,
    };
    const paperStyle: OrigamiPaperStyle = {
      frontColor: "#f7f0d4",
      backColor: "#365f91",
      frontPattern: "grid",
      backPattern: "diagonal-stripe",
      creaseColor: "#e8b65c",
      highlightColor: "#fff2bb",
      opacity: 1,
      patternScale: 1,
      patternRotation: 0,
    };
    const exported: OrigamiFunctionAnimationExport = {
      version: 1,
      plan,
      animation,
      paperStyle,
    };

    expect(exported.plan.phases[0].kind).toBe("mark-input");
    expect(exported.paperStyle.backPattern).toBe("diagonal-stripe");
  });
});
