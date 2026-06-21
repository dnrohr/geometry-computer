import type { Expr } from "../expression/types";
import { formatExpression } from "../expression/format";
import {
  ConstructionContext,
  ConstructionError,
} from "../construction/ConstructionContext";
import type { ConstructionOpKind } from "../construction/types";
import { arithmeticProofs } from "../proofs/arithmeticProofs";
import {
  arcObject,
  labelObject,
  segmentObject,
  type GeomObject,
  type GeomRole,
} from "../geometry/types";

export type CompiledScene = {
  title: string;
  expression: string;
  simplifiedExpression: string;
  values: Record<string, number>;
  value: number;
  viewBox: string;
  objects: GeomObject[];
  steps: ReturnType<ConstructionContext["trace"]>["steps"];
  revealActions: ReturnType<ConstructionContext["trace"]>["revealActions"];
  proofs: ReturnType<ConstructionContext["trace"]>["proofs"];
  ast: Expr;
};
const evaluate = (expr: Expr, values: Record<string, number>): number => {
  switch (expr.kind) {
    case "const":
      return expr.value;
    case "var": {
      const value = values[expr.name];
      if (value === undefined)
        throw new ConstructionError(
          `Supply a value for ${expr.name}.`,
          "MISSING_VARIABLE",
        );
      return value;
    }
    case "add":
      return evaluate(expr.left, values) + evaluate(expr.right, values);
    case "sub":
      return evaluate(expr.left, values) - evaluate(expr.right, values);
    case "mul":
      return evaluate(expr.left, values) * evaluate(expr.right, values);
    case "div": {
      const divisor = evaluate(expr.right, values);
      if (divisor === 0)
        throw new ConstructionError(
          "Division by zero has no straightedge-and-compass construction.",
          "DIVISION_BY_ZERO",
        );
      return evaluate(expr.left, values) / divisor;
    }
    case "pow":
      return evaluate(expr.base, values) ** expr.exponent;
    case "sqrt": {
      const value = evaluate(expr.value, values);
      if (value < 0)
        throw new ConstructionError(
          "A negative length has no real square root construction.",
          "NEGATIVE_SQUARE_ROOT",
        );
      return Math.sqrt(value);
    }
  }
};
const meta = (
  id: string,
  role: GeomRole,
  step: string,
  represents: string,
  deps: string[] = [],
) => ({
  id,
  role,
  createdByStepId: step,
  usedByStepIds: [],
  dependsOnObjectIds: deps,
  represents,
});

export function compileExpression(
  ast: Expr,
  values: Record<string, number>,
  original = formatExpression(ast),
  simplified = formatExpression(ast),
): CompiledScene {
  const context = new ConstructionContext();
  const cache = new Map<string, { id: string; value: number }>();
  let row = 0;
  const compile = (expr: Expr): { id: string; value: number } => {
    const key = formatExpression(expr);
    const cached = cache.get(key);
    if (cached) return cached;
    const value = evaluate(expr, values);
    if (expr.kind === "pow" && expr.exponent !== 2)
      throw new ConstructionError(
        "Only squaring is currently constructible through exponent syntax.",
        "UNSUPPORTED_POWER",
      );
    const operation: ConstructionOpKind =
      expr.kind === "var"
        ? "given"
        : expr.kind === "const"
          ? "constant"
          : expr.kind === "pow"
            ? "square"
            : expr.kind;
    const inputs =
      expr.kind === "sqrt"
        ? [compile(expr.value)]
        : expr.kind === "pow"
          ? [compile(expr.base)]
          : "left" in expr
            ? [compile(expr.left), compile(expr.right)]
            : [];
    const stepId = context.ids.next("step");
    const id = context.ids.next("segment");
    const y = 55 + row++ * 62;
    const length = Math.max(28, Math.min(430, Math.abs(value) * 34));
    const role: GeomRole = inputs.length
      ? "intermediate"
      : operation === "constant" && value === 1
        ? "unit"
        : "input";
    const segment = segmentObject(
      { x: 65, y },
      { x: 65 + length, y },
      meta(
        id,
        role,
        stepId,
        key,
        inputs.map((input) => input.id),
      ),
    );
    context.registerValue(key, segment);
    context.objects.push(
      labelObject(
        { x: 75 + length / 2, y: y - 13 },
        `${key} = ${Number(value.toFixed(4))}`,
        meta(context.ids.next("label"), role, stepId, key, [id]),
      ),
    );
    const proofId = arithmeticProofs[operation]?.id;
    context.addStep({
      id: stepId,
      level: "macro",
      title: inputs.length ? `Construct ${key}` : `Place ${key}`,
      summary: method(operation),
      operation,
      inputObjectIds: inputs.map((input) => input.id),
      outputObjectIds: [id],
      createdObjectIds: [id],
      proofId,
    });
    if (proofId)
      context.addProof({
        ...arithmeticProofs[operation],
        claims: arithmeticProofs[operation].claims.map((claim) => ({
          ...claim,
          highlightObjectIds: [...inputs.map((input) => input.id), id],
        })),
      });
    context.addReveal({
      id: context.ids.next("reveal"),
      stepId,
      objectId: id,
      start: Math.min(0.92, (context.steps.length - 1) / 10),
      end: Math.min(1, context.steps.length / 10 + 0.08),
      animation: "draw",
    });
    if (operation === "mul" || operation === "div")
      addTriangleScaffold(
        context,
        stepId,
        y,
        inputs.map((item) => item.id),
        id,
      );
    if (operation === "sqrt")
      addRootScaffold(context, stepId, y, inputs[0].id, id);
    const output = { id, value };
    cache.set(key, output);
    return output;
  };
  const result = compile(ast);
  const output = context.requireValue(formatExpression(ast));
  output.role = "result";
  const label = context.objects.find(
    (object) =>
      object.dependsOnObjectIds.includes(result.id) && object.kind === "label",
  );
  if (label) label.role = "result";
  const trace = context.trace();
  return {
    title: "Compiled geometric construction",
    expression: original,
    simplifiedExpression: simplified,
    values,
    value: result.value,
    viewBox: `0 0 760 ${Math.max(480, 120 + row * 62)}`,
    objects: context.objects,
    steps: trace.steps,
    revealActions: trace.revealActions,
    proofs: trace.proofs,
    ast,
  };
}
const method = (operation: ConstructionOpKind) =>
  ({
    given: "Use the supplied directed length.",
    constant: "Transfer a unit multiple.",
    add: "Transfer the inputs consecutively on a ray.",
    sub: "Transfer the second input in the opposite direction.",
    mul: "Scale with a pair of similar triangles.",
    div: "Reverse a similar-triangle scale.",
    square: "Multiply the length by itself.",
    sqrt: "Take the geometric mean in a semicircle.",
  })[operation];
function addTriangleScaffold(
  context: ConstructionContext,
  step: string,
  y: number,
  deps: string[],
  result: string,
) {
  const baseY = y + 34;
  const a = segmentObject(
    { x: 500, y: baseY },
    { x: 650, y: baseY },
    meta(
      context.ids.next("scaffold"),
      "scaffold",
      step,
      "similar triangle baseline",
      deps,
    ),
  );
  const b = segmentObject(
    { x: 500, y: baseY },
    { x: 555, y: baseY - 55 },
    meta(
      context.ids.next("scaffold"),
      "scaffold",
      step,
      "similar triangle ray",
      deps,
    ),
  );
  const c = segmentObject(
    { x: 650, y: baseY },
    { x: 590, y: baseY - 90 },
    meta(
      context.ids.next("scaffold"),
      "active-construction",
      step,
      "parallel scaling line",
      [...deps, result],
    ),
  );
  context.objects.push(a, b, c);
}
function addRootScaffold(
  context: ConstructionContext,
  step: string,
  y: number,
  input: string,
  result: string,
) {
  context.objects.push(
    arcObject(
      { x: 585, y: y + 20 },
      75,
      180,
      360,
      meta(context.ids.next("semicircle"), "scaffold", step, "diameter 1 + x", [
        input,
      ]),
    ),
    segmentObject(
      { x: 585, y: y + 20 },
      { x: 585, y: y - 55 },
      meta(
        context.ids.next("perpendicular"),
        "active-construction",
        step,
        "geometric mean altitude",
        [input, result],
      ),
    ),
  );
}
