import { formatExpression } from "../expression/format";
import { parseExpression } from "./parseExpression";
describe("parseExpression", () => {
  it.each([
    "a+b",
    "a-b",
    "a*b",
    "a/b",
    "a^2",
    "sqrt(a)",
    "3*a^2 + 4*a*b + b^2",
  ])("parses %s", (source) =>
    expect(formatExpression(parseExpression(source))).toBeTruthy(),
  );
  it("uses arithmetic precedence", () =>
    expect(parseExpression("a+b*c").kind).toBe("add"));
  it("rejects implicit multiplication", () =>
    expect(() => parseExpression("3a")).toThrow(/unexpected token/i));
});
