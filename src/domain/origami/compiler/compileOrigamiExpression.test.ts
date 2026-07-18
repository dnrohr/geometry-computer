import { readFileSync } from "node:fs";
import { parseExpression } from "../../parser/parseExpression";
import { compiledOrigamiArithmeticExamples } from "../examples";
import {
  OrigamiCompilerError,
  compileOrigamiExpression,
} from "./compileOrigamiExpression";

describe("origami expression compiler", () => {
  it("compiles parsed variables and constants into isolated origami scenes", () => {
    const variableScene = compileOrigamiExpression(
      parseExpression("a"),
      { a: 3 },
      "a",
    );
    const constantScene = compileOrigamiExpression(
      parseExpression("2"),
      {},
      "2",
    );

    expect(variableScene).toMatchObject({
      title: "Compiled origami trace",
      expression: "a",
      value: 3,
      steps: [{ operation: "place-input" }],
    });
    expect(constantScene).toMatchObject({
      expression: "2",
      value: 2,
      steps: [{ operation: "constant" }],
    });
  });

  it("compiles addition and subtraction into origami-only arithmetic traces", () => {
    const addScene = compileOrigamiExpression(
      parseExpression("a+b"),
      { a: 3, b: 2 },
      "a+b",
    );
    const subScene = compileOrigamiExpression(
      parseExpression("a-b"),
      { a: 3, b: 2 },
      "a-b",
    );

    expect(addScene.value).toBe(5);
    expect(addScene.steps.map(({ operation }) => operation)).toEqual([
      "place-input",
      "place-input",
      "add",
    ]);
    expect(
      addScene.objects.find(({ role }) => role === "result"),
    ).toMatchObject({
      kind: "segment",
      provenance: { expression: "a + b" },
    });
    expect(subScene.value).toBe(1);
    expect(subScene.steps.map(({ operation }) => operation)).toEqual([
      "place-input",
      "place-input",
      "sub",
    ]);
  });

  it("ships one example per supported basic arithmetic family", () => {
    const examples = compiledOrigamiArithmeticExamples();

    expect(examples.map(({ title }) => title)).toEqual([
      "Input length",
      "Constant length",
      "Addition trace",
      "Subtraction trace",
    ]);
    expect(examples.map(({ scene }) => scene.value)).toEqual([3, 2, 5, 1]);
  });

  it("returns readable origami-specific errors for missing and unsupported inputs", () => {
    expect(() => compileOrigamiExpression(parseExpression("z"), {})).toThrow(
      new OrigamiCompilerError("Supply a value for z.", "MISSING_VARIABLE"),
    );
    expect(() =>
      compileOrigamiExpression(parseExpression("a*b"), { a: 3, b: 2 }),
    ).toThrow(/first origami arithmetic trace slice/i);
  });

  it("does not import the compass-straightedge compiler", () => {
    const source = readFileSync(
      "src/domain/origami/compiler/compileOrigamiExpression.ts",
      "utf8",
    );
    expect(source).not.toContain("compileExpression");
    expect(source).not.toContain("../construction");
  });
});
