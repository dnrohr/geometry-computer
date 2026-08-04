export type Expr =
  | { kind: "const"; value: number }
  | { kind: "var"; name: string }
  | { kind: "add"; left: Expr; right: Expr }
  | { kind: "sub"; left: Expr; right: Expr }
  | { kind: "mul"; left: Expr; right: Expr }
  | { kind: "div"; left: Expr; right: Expr }
  | { kind: "pow"; base: Expr; exponent: number }
  | { kind: "sqrt"; value: Expr }
  | { kind: "cbrt"; value: Expr }
  | {
      kind: "cubicRoot";
      coefficients: [Expr, Expr, Expr, Expr];
      rootIndex: number;
    };

export const constant = (value: number): Expr => ({ kind: "const", value });
export const variable = (name: string): Expr => ({ kind: "var", name });
export const add = (left: Expr, right: Expr): Expr => ({
  kind: "add",
  left,
  right,
});
export const sub = (left: Expr, right: Expr): Expr => ({
  kind: "sub",
  left,
  right,
});
export const mul = (left: Expr, right: Expr): Expr => ({
  kind: "mul",
  left,
  right,
});
export const div = (left: Expr, right: Expr): Expr => ({
  kind: "div",
  left,
  right,
});
export const pow = (base: Expr, exponent: number): Expr => ({
  kind: "pow",
  base,
  exponent,
});
export const sqrt = (value: Expr): Expr => ({ kind: "sqrt", value });
export const cbrt = (value: Expr): Expr => ({ kind: "cbrt", value });
export const cubicRoot = (
  coefficients: [Expr, Expr, Expr, Expr],
  rootIndex: number,
): Expr => ({ kind: "cubicRoot", coefficients, rootIndex });
