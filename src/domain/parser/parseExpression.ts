import type { Expr } from "../expression/types";

export class ParseError extends Error {}

export function parseExpression(source: string): Expr {
  const tokens =
    source.match(/sqrt|[A-Za-z]+|(?:\d+\.?\d*|\.\d+)|[()+\-*/^]/g) ?? [];
  if (tokens.join("").toLowerCase() !== source.replace(/\s/g, "").toLowerCase())
    throw new ParseError("Expression contains an unsupported character.");
  let at = 0;
  const peek = () => tokens[at];
  const take = (value?: string) => {
    const token = tokens[at++];
    if (!token || (value && token !== value))
      throw new ParseError(`Expected ${value ?? "a value"}.`);
    return token;
  };
  const primary = (): Expr => {
    const token = peek();
    if (token === "(") {
      take("(");
      const value = sum();
      take(")");
      return value;
    }
    if (token?.toLowerCase() === "sqrt") {
      take();
      take("(");
      const value = sum();
      take(")");
      return { kind: "sqrt", value };
    }
    if (token === "-") {
      take();
      return {
        kind: "sub",
        left: { kind: "const", value: 0 },
        right: primary(),
      };
    }
    if (token && /^(?:\d|\.)/.test(token))
      return { kind: "const", value: Number(take()) };
    if (token && /^[A-Za-z]+$/.test(token))
      return { kind: "var", name: take() };
    throw new ParseError(
      "Expected a number, variable, or parenthesized expression.",
    );
  };
  const power = (): Expr => {
    let value = primary();
    if (peek() === "^") {
      take();
      const exponent = Number(take());
      if (!Number.isInteger(exponent))
        throw new ParseError("Exponent must be an integer.");
      value = { kind: "pow", base: value, exponent };
    }
    return value;
  };
  const product = (): Expr => {
    let value = power();
    while (peek() === "*" || peek() === "/") {
      const op = take();
      value = { kind: op === "*" ? "mul" : "div", left: value, right: power() };
    }
    return value;
  };
  const sum = (): Expr => {
    let value = product();
    while (peek() === "+" || peek() === "-") {
      const op = take();
      value = {
        kind: op === "+" ? "add" : "sub",
        left: value,
        right: product(),
      };
    }
    return value;
  };
  if (!source.trim()) throw new ParseError("Enter an expression.");
  const result = sum();
  if (at !== tokens.length)
    throw new ParseError(`Unexpected token “${peek()}”.`);
  return result;
}
