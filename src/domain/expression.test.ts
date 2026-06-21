import {
  buildConstructionPlan,
  describeExpression,
  evaluateExpression,
  parseExpression,
} from "./expression";

describe("constructible expressions", () => {
  it("honors arithmetic precedence and parentheses", () => {
    expect(evaluateExpression(parseExpression("2 + 3 * 4"))).toBe(14);
    expect(evaluateExpression(parseExpression("(2 + 3) * 4"))).toBe(20);
  });

  it("supports nested square roots", () => {
    expect(evaluateExpression(parseExpression("sqrt(9 + sqrt(16))"))).toBe(
      Math.sqrt(13),
    );
  });

  it("rejects invalid syntax with a source position", () => {
    expect(() => parseExpression("2 + @")).toThrow(
      "Unexpected '@' at character 5",
    );
    expect(() => parseExpression("sqrt 4")).toThrow(
      "Expected '(' after sqrt at character 6",
    );
  });

  it("rejects undefined real-length operations", () => {
    expect(() => evaluateExpression(parseExpression("1 / 0"))).toThrow(
      "Division by zero",
    );
    expect(() => evaluateExpression(parseExpression("sqrt(1 - 2)"))).toThrow(
      "non-negative length",
    );
  });

  it("describes operations in dependency order", () => {
    expect(describeExpression(parseExpression("sqrt(2) + 1"))).toEqual([
      "L1: Take the square root of 2",
      "L2: Add L1 and 1",
    ]);
  });

  it("builds a typed plan with resolved operand values", () => {
    expect(buildConstructionPlan(parseExpression("sqrt(4) + 3"))).toEqual([
      {
        id: "L1",
        operation: "sqrt",
        operands: [{ reference: "4", value: 4 }],
        value: 2,
        description: "Take the square root of 4",
      },
      {
        id: "L2",
        operation: "add",
        operands: [
          { reference: "L1", value: 2 },
          { reference: "3", value: 3 },
        ],
        value: 5,
        description: "Add L1 and 3",
      },
    ]);
  });
});
