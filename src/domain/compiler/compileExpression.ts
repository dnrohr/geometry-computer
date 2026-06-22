import type { Expr } from "../expression/types";
import { formatExpression } from "../expression/format";
import {
  ConstructionContext,
  ConstructionError,
} from "../construction/ConstructionContext";
import type { ConstructionOpKind } from "../construction/types";
import { arithmeticProofs } from "../proofs/arithmeticProofs";
import {
  labelObject,
  segmentObject,
  type GeomObject,
  type GeomRole,
} from "../geometry/types";
import { generateAddition } from "../construction/macros/addition";
import { generateSubtraction } from "../construction/macros/subtraction";
import { generateMultiplication } from "../construction/macros/multiplication";
import { generateDivision } from "../construction/macros/division";
import { generateSquare } from "../construction/macros/square";
import { generateSquareRoot } from "../construction/macros/squareRoot";
import {
  metadata,
  point,
  scaledLength,
  type ConstructedValue,
  type MacroRequest,
} from "../construction/macros/macroTypes";
import { buildFinalFigure } from "../geometry/finalFigure";

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

function evaluate(expr: Expr, values: Record<string, number>): number {
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
      if (expr.exponent !== 2)
        throw new ConstructionError(
          "Only squaring is currently constructible through exponent syntax.",
          "UNSUPPORTED_POWER",
        );
      return evaluate(expr.base, values) ** 2;
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
}

export function compileExpression(
  ast: Expr,
  values: Record<string, number>,
  original = formatExpression(ast),
  simplified = formatExpression(ast),
): CompiledScene {
  const context = new ConstructionContext();
  const cache = new Map<string, ConstructedValue>();
  let row = 0;

  const compile = (expr: Expr): ConstructedValue => {
    const key = formatExpression(expr);
    const cached = cache.get(key);
    if (cached) return cached;
    const value = evaluate(expr, values);
    const y = 55 + row++ * 145;

    if (expr.kind === "var" || expr.kind === "const") {
      const operation: ConstructionOpKind =
        expr.kind === "var" ? "given" : "constant";
      const stepId = context.ids.next("step");
      const role: GeomRole =
        operation === "constant" && value === 1 ? "unit" : "input";
      const direction = value < 0 ? -1 : 1;
      const end = 65 + direction * scaledLength(value);
      const result = segmentObject(
        point(65, y),
        point(end, y),
        metadata(context.ids.next("segment"), role, stepId, key),
      );
      context.registerValue(key, result);
      const label = labelObject(
        point((65 + end) / 2, y - 13),
        key,
        metadata(context.ids.next("label"), role, stepId, key, [result.id]),
      );
      context.addObject(label);
      context.addStep({
        id: stepId,
        level: "macro",
        title: `Place ${key}`,
        summary:
          operation === "given"
            ? "Use the supplied directed length."
            : "Transfer this multiple of the fixed unit segment.",
        operation,
        inputObjectIds: [],
        outputObjectIds: [result.id],
        createdObjectIds: [result.id, label.id],
      });
      context.revealObject(result.id, stepId);
      context.revealObject(label.id, stepId, "fade-in");
      const output = { id: result.id, value, object: result };
      cache.set(key, output);
      return output;
    }

    const inputs =
      expr.kind === "sqrt"
        ? [compile(expr.value)]
        : expr.kind === "pow"
          ? [compile(expr.base)]
          : [compile(expr.left), compile(expr.right)];
    const operation: ConstructionOpKind =
      expr.kind === "pow" ? "square" : expr.kind;
    const request: MacroRequest = {
      context,
      key,
      value,
      inputs,
      y,
      proof: arithmeticProofs[operation],
    };
    const output =
      operation === "add"
        ? generateAddition(request)
        : operation === "sub"
          ? generateSubtraction(request)
          : operation === "mul"
            ? generateMultiplication(request)
            : operation === "div"
              ? generateDivision(request)
              : operation === "square"
                ? generateSquare(request)
                : generateSquareRoot(request);
    cache.set(key, output);
    return output;
  };

  const result = compile(ast);
  result.object.role = "result";
  context.objects
    .filter(
      ({ dependsOnObjectIds, kind }) =>
        kind === "label" && dependsOnObjectIds.includes(result.id),
    )
    .forEach((label) => (label.role = "result"));
  const trace = context.trace();
  const figure = buildFinalFigure(
    ast,
    values,
    context.objects,
    trace.steps,
    trace.revealActions,
  );
  return {
    title: "Compiled geometric construction",
    expression: original,
    simplifiedExpression: simplified,
    values,
    value: result.value,
    viewBox: figure.viewBox,
    objects: figure.objects,
    steps: figure.steps,
    revealActions: figure.revealActions,
    proofs: trace.proofs.map((proof) => ({
      ...proof,
      claims: proof.claims.map((claim) => ({
        ...claim,
        highlightObjectIds: claim.highlightObjectIds.filter((id) =>
          figure.objects.some((object) => object.id === id),
        ),
      })),
    })),
    ast,
  };
}
