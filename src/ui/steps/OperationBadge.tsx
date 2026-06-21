import type { ConstructionStep } from "../../domain/construction/types";
export function OperationBadge({
  step,
  onProof,
}: {
  step: ConstructionStep;
  onProof?: () => void;
}) {
  if (!step.operation) return null;
  const methods = {
    given: "given length",
    constant: "unit transfer",
    add: "segment transfer",
    sub: "directed transfer",
    mul: "similar-triangle scaling",
    div: "inverse scaling",
    square: "self-scaling",
    sqrt: "geometric mean",
  };
  return (
    <div className="operation-badge">
      <strong>{step.operation}</strong>
      <span>
        {step.inputObjectIds.join(" + ") || "given"} →{" "}
        {step.outputObjectIds.join(", ")}
      </span>
      <small>{methods[step.operation]}</small>
      {step.proofId && (
        <button type="button" onClick={onProof}>
          Why?
        </button>
      )}
    </div>
  );
}
