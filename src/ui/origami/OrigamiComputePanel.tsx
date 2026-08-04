import { useMemo, useState } from "react";
import {
  exactText,
  decimalText,
  symbolicText,
} from "../../domain/origami/algebra/origamiNumber";
import {
  planOrigamiExpression,
  type OrigamiComputePlan,
} from "../../domain/origami/compute/planExpression";
import { parseExpression } from "../../domain/parser/parseExpression";

const examples = [
  { label: "Rational", expression: "a+b", values: "a=2, b=3" },
  { label: "Square root", expression: "sqrt(a)", values: "a=2" },
  { label: "Cube root", expression: "cbrt(2)", values: "" },
  { label: "Mixed", expression: "cbrt(a)+sqrt(b)", values: "a=8, b=9" },
  { label: "Three cubic roots", expression: "cubic(1,-6,11,-6,1)", values: "" },
];

const parseValues = (source: string) => {
  const values: Record<string, number> = {};
  if (!source.trim()) return values;
  for (const assignment of source.split(",")) {
    const match = assignment
      .trim()
      .match(/^([A-Za-z]+)\s*=\s*([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)$/i);
    if (!match)
      throw new Error(
        `Invalid variable assignment “${assignment.trim()}”. Use name=value.`,
      );
    const value = Number(match[2]);
    if (!Number.isFinite(value))
      throw new Error(`${match[1]} must have a finite numeric value.`);
    values[match[1]] = value;
  }
  return values;
};

export function OrigamiComputePanel({
  onCompile,
  onSelectNode,
}: {
  onCompile: (plan: OrigamiComputePlan) => void;
  onSelectNode: (plan: OrigamiComputePlan, nodeId: string) => void;
}) {
  const [expression, setExpression] = useState("cbrt(2)");
  const [valuesText, setValuesText] = useState("");
  const [plan, setPlan] = useState<OrigamiComputePlan>();
  const [error, setError] = useState<string>();
  const [selectedNodeId, setSelectedNodeId] = useState<string>();
  const requiredAxioms = useMemo(
    () => [
      ...new Set(
        plan?.templates.flatMap(({ requiredAxioms: ids }) => ids) ?? [],
      ),
    ],
    [plan],
  );
  const selectedNode = plan?.nodes.find(
    ({ expressionNodeId }) => expressionNodeId === selectedNodeId,
  );
  const selectedTemplate = plan?.templates.find(
    ({ id }) => id === selectedNode?.templateId,
  );
  const compile = () => {
    try {
      const next = planOrigamiExpression(
        parseExpression(expression),
        parseValues(valuesText),
      );
      setPlan(next);
      setError(undefined);
      setSelectedNodeId(next.analysis.rootNodeId);
      onCompile(next);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "The origami expression could not be compiled.",
      );
    }
  };
  const selectExample = (item: (typeof examples)[number]) => {
    setExpression(item.expression);
    setValuesText(item.values);
  };
  const value = plan?.analysis.value;
  return (
    <section
      className="origami-compute"
      aria-labelledby="origami-compute-title"
    >
      <div className="origami-compute-heading">
        <div>
          <p className="section-label">General origami compute</p>
          <h2 id="origami-compute-title">
            Compile an algebraic value into folds
          </h2>
          <p>
            Field arithmetic, square roots, real cube roots, and explicitly
            selected cubic roots compile into an exact, branch-resolved fold
            session.
          </p>
        </div>
        <div className="origami-compute-inputs">
          <label>
            Expression
            <input
              aria-label="Origami expression"
              value={expression}
              onChange={(event) => setExpression(event.target.value)}
            />
          </label>
          <label>
            Variables <span>comma-separated name=value</span>
            <input
              aria-label="Origami variables"
              value={valuesText}
              onChange={(event) => setValuesText(event.target.value)}
              placeholder="a=8, b=9"
            />
          </label>
          <button type="button" onClick={compile}>
            Compile origami expression
          </button>
        </div>
      </div>
      <div
        className="origami-compute-examples"
        aria-label="Origami compute examples"
      >
        {examples.map((item) => (
          <button
            type="button"
            key={item.label}
            onClick={() => selectExample(item)}
          >
            <strong>{item.label}</strong>
            <code>{item.expression}</code>
          </button>
        ))}
      </div>
      {error && (
        <p className="origami-author-error" role="alert">
          {error} Your last valid computed session is unchanged.
        </p>
      )}
      {plan && value && (
        <div className="origami-compute-result">
          <div>
            <p className="section-label">Exact result</p>
            <h3>{symbolicText(value)}</h3>
            <dl>
              <dt>Classification</dt>
              <dd>{plan.analysis.classification}</dd>
              <dt>Exact identity</dt>
              <dd>
                <code>{exactText(value)}</code>
              </dd>
              <dt>Decimal approximation</dt>
              <dd>{decimalText(value, 12)}</dd>
              <dt>Algebraic degree</dt>
              <dd>{value.polynomial.length - 1}</dd>
              <dt>Required axioms</dt>
              <dd>{requiredAxioms.join(", ") || "O1"}</dd>
              <dt>Fold count</dt>
              <dd>{plan.session.steps.length}</dd>
            </dl>
          </div>
          <div>
            <p className="section-label">Expression-to-fold trace</p>
            <ol>
              {plan.nodes.map((node) => (
                <li
                  key={node.expressionNodeId}
                  className={
                    node.expressionNodeId === selectedNodeId
                      ? "active"
                      : node.kind === "cbrt" || node.kind === "cubicRoot"
                        ? "origami-only"
                        : ""
                  }
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedNodeId(node.expressionNodeId);
                      onSelectNode(plan, node.expressionNodeId);
                    }}
                  >
                    <code>{node.expression}</code>
                    <span>
                      {node.foldIds.length
                        ? `${node.foldIds.length} fold${node.foldIds.length === 1 ? "" : "s"}`
                        : "given"}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
          {selectedTemplate && (
            <div className="origami-algebra-inspector">
              <p className="section-label">Algebra and branch inspector</p>
              <h3>{selectedNode?.expression}</h3>
              <dl>
                <dt>Defining polynomial</dt>
                <dd>
                  <code>
                    [{selectedTemplate.output.polynomial.map(String).join(", ")}
                    ]
                  </code>
                </dd>
                <dt>Isolating interval</dt>
                <dd>
                  <code>
                    (
                    {selectedTemplate.output.interval.lower.numerator.toString()}
                    /
                    {selectedTemplate.output.interval.lower.denominator.toString()}
                    ,{" "}
                    {selectedTemplate.output.interval.upper.numerator.toString()}
                    /
                    {selectedTemplate.output.interval.upper.denominator.toString()}
                    )
                  </code>
                </dd>
              </dl>
              {selectedTemplate.folds.flatMap(
                ({ candidate, rejectedCandidates }) => [
                  <p key="selected">
                    <strong>Selected crease:</strong> root parameter{" "}
                    {candidate.rootParameter ?? "unique"}; residual{" "}
                    {candidate.maxResidual.toExponential(2)}
                  </p>,
                  ...rejectedCandidates.map((rejected) => (
                    <p key={rejected.index}>
                      <strong>Alternative crease {rejected.index + 1}:</strong>{" "}
                      {rejected.reason}
                    </p>
                  )),
                ],
              )}
              <ol>
                {selectedTemplate.proofClaims.map((claim) => (
                  <li key={claim.id}>
                    <strong>{claim.statement}</strong>
                    <span>{claim.justification}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
