import { formatExpression } from "../../expression/format";
import type { Expr } from "../../expression/types";
import type { OrigamiNumber } from "../algebra/origamiNumber";
import {
  emptyOrigamiSession,
  appendSessionFold,
  type OrigamiSession,
} from "../session";
import { exactText } from "../algebra/origamiNumber";
import { textR } from "../algebra/rational";
import { solveAxiom } from "../axioms";
import {
  analyzeOrigamiExpression,
  type ExpressionAnalysis,
} from "./analyzeExpression";
import {
  instantiateConstructionTemplate,
  type ConstructionTemplate,
  type TemplateRequest,
} from "./constructionTemplates";

export type PlannedExpressionNode = {
  expressionNodeId: string;
  expression: string;
  kind: Expr["kind"];
  dependencyIds: string[];
  templateId?: string;
  foldIds: string[];
};

export type OrigamiComputePlan = {
  schema: "geometry-computer/origami-compute-plan";
  version: 1;
  expression: string;
  variables: Record<string, number>;
  analysis: ExpressionAnalysis;
  templates: ConstructionTemplate[];
  nodes: PlannedExpressionNode[];
  session: OrigamiSession;
};

export class OrigamiPlanningError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
  }
}

const children = (expr: Expr): Expr[] => {
  switch (expr.kind) {
    case "const":
    case "var":
      return [];
    case "sqrt":
    case "cbrt":
      return [expr.value];
    case "pow":
      return [expr.base];
    case "cubicRoot":
      return expr.coefficients;
    default:
      return [expr.left, expr.right];
  }
};

const rationalCoefficient = (value: OrigamiNumber): bigint[] => {
  if (value.polynomial.length !== 2)
    throw new OrigamiPlanningError(
      "Cubic coefficients must be rational.",
      "NON_RATIONAL_COEFFICIENT",
    );
  return [value.polynomial[0], value.polynomial[1]];
};

export function planOrigamiExpression(
  expression: Expr,
  variables: Record<string, number> = {},
): OrigamiComputePlan {
  const analysis = analyzeOrigamiExpression(expression, variables);
  if (!analysis.value)
    throw new OrigamiPlanningError(
      analysis.reason,
      analysis.diagnostic?.code ?? "ANALYSIS_FAILED",
    );
  const analyzedByExpression = new Map(
    analysis.nodes.map((node) => [node.expression, node]),
  );
  const templates: ConstructionTemplate[] = [];
  const nodes: PlannedExpressionNode[] = [];
  const visited = new Set<string>();
  let session = emptyOrigamiSession(
    `Origami compute: ${formatExpression(expression)}`,
  );

  const visit = (expr: Expr) => {
    const key = formatExpression(expr);
    if (visited.has(key)) return;
    children(expr).forEach(visit);
    visited.add(key);
    const analyzed = analyzedByExpression.get(key)!;
    const dependencyIds = children(expr).map(
      (child) => analyzedByExpression.get(formatExpression(child))!.id,
    );
    let request: TemplateRequest | undefined;
    const valueOf = (child: Expr) =>
      analyzedByExpression.get(formatExpression(child))!.value!;
    switch (expr.kind) {
      case "const":
      case "var":
        break;
      case "add":
        request = {
          operation: "add",
          left: valueOf(expr.left),
          right: valueOf(expr.right),
        };
        break;
      case "sub":
        request = {
          operation: "subtract",
          left: valueOf(expr.left),
          right: valueOf(expr.right),
        };
        break;
      case "mul":
        request = {
          operation: "multiply",
          left: valueOf(expr.left),
          right: valueOf(expr.right),
        };
        break;
      case "div":
        request = {
          operation: "divide",
          left: valueOf(expr.left),
          right: valueOf(expr.right),
        };
        break;
      case "sqrt":
        request = { operation: "square-root", value: valueOf(expr.value) };
        break;
      case "cbrt":
        request = { operation: "cube-root", value: valueOf(expr.value) };
        break;
      case "pow": {
        if (expr.exponent === 0) request = { operation: "unit" };
        else if (expr.exponent === 2)
          request = {
            operation: "multiply",
            left: valueOf(expr.base),
            right: valueOf(expr.base),
          };
        else
          throw new OrigamiPlanningError(
            "The fold planner currently expands only powers 0 and 2.",
            "PLANNER_POWER_LIMIT",
          );
        break;
      }
      case "cubicRoot": {
        const rationals = expr.coefficients.map((coefficient) =>
          rationalCoefficient(valueOf(coefficient)),
        );
        const denominator = rationals.reduce(
          (product, pair) => product * pair[1],
          1n,
        );
        const integer = rationals.map(
          ([numerator, divisor]) => numerator * (denominator / divisor),
        );
        request = {
          operation: "cubic-root",
          coefficients: [integer[3], integer[2], integer[1], integer[0]],
          rootIndex: expr.rootIndex,
        };
        break;
      }
    }
    if (!request) {
      nodes.push({
        expressionNodeId: analyzed.id,
        expression: key,
        kind: expr.kind,
        dependencyIds,
        foldIds: [],
      });
      return;
    }
    const template = instantiateConstructionTemplate(request);
    const templateId = `${template.id}-${templates.length + 1}`;
    template.id = templateId;
    const foldIds: string[] = [];
    for (const fold of template.folds) {
      session = appendSessionFold(session, {
        operation: "formal-axiom",
        title: `${key}: ${fold.title}`,
        movingSide: "left",
        request: fold.request,
        candidate: fold.selectedCandidate,
      });
      const stepIndex = session.steps.length - 1;
      const steps = [...session.steps];
      const rejected = new Map(
        fold.rejectedCandidates.map((candidate) => [
          candidate.index,
          candidate.reason,
        ]),
      );
      const allCandidates = solveAxiom(fold.request).candidates;
      steps[stepIndex] = {
        ...steps[stepIndex],
        provenance: {
          sessionStepId: steps[stepIndex].id,
          expressionNodeId: analyzed.id,
          expression: key,
          templateId,
          exactValue: exactText(template.output),
          polynomial: template.output.polynomial.map(String),
          isolatingInterval: {
            lower: textR(template.output.interval.lower),
            upper: textR(template.output.interval.upper),
          },
          selectedCandidate: fold.selectedCandidate,
          candidates: allCandidates.map((candidate, index) => ({
            index,
            rootParameter: candidate.rootParameter,
            maxResidual: candidate.maxResidual,
            selected: index === fold.selectedCandidate,
            reason: rejected.get(index),
          })),
          proofClaims: template.proofClaims,
          creaseObjectIds: steps[stepIndex].document.objects
            .filter(({ kind }) => kind === "crease")
            .map(({ id }) => id),
          objectIds: steps[stepIndex].document.objects.map(({ id }) => id),
          physicalInstruction: `Make the ${fold.request.axiom} crease, press it accurately, then ${fold.unfoldAfter ? "unfold while retaining the crease" : "leave the paper folded"}.`,
        },
      };
      session = { ...session, steps };
      foldIds.push(session.steps.at(-1)!.id);
    }
    templates.push(template);
    nodes.push({
      expressionNodeId: analyzed.id,
      expression: key,
      kind: expr.kind,
      dependencyIds,
      templateId,
      foldIds,
    });
  };

  visit(expression);
  return {
    schema: "geometry-computer/origami-compute-plan",
    version: 1,
    expression: formatExpression(expression),
    variables,
    analysis,
    templates,
    nodes,
    session,
  };
}
