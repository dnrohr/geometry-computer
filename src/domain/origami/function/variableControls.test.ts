import {
  clampOrigamiVariableValue,
  origamiVariableControls,
} from "./variableControls";

describe("origami variable controls", () => {
  it("creates numeric slider/stepper metadata for active variables", () => {
    expect(origamiVariableControls(["a", "b"], { a: 3, b: 2 })).toEqual([
      {
        name: "a",
        value: 3,
        defaultValue: 3,
        min: -10,
        max: 10,
        step: 0.25,
      },
      {
        name: "b",
        value: 2,
        defaultValue: 2,
        min: -10,
        max: 10,
        step: 0.25,
      },
    ]);
  });

  it("clamps nonfinite and out-of-range values", () => {
    expect(clampOrigamiVariableValue(Number.NaN)).toBe(0);
    expect(clampOrigamiVariableValue(12)).toBe(10);
    expect(clampOrigamiVariableValue(-12)).toBe(-10);
  });
});
