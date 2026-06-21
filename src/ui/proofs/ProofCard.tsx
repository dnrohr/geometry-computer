import { useState } from "react";
import type { OperationProof } from "../../domain/construction/types";
export function ProofCard({
  proof,
  onHighlight,
  onClose,
}: {
  proof: OperationProof;
  onHighlight?: (ids: string[]) => void;
  onClose?: () => void;
}) {
  const [selectedClaimId, setSelectedClaimId] = useState<string>();
  return (
    <article className="proof-card" aria-label={`${proof.title} proof`}>
      <header>
        <h3>{proof.title}</h3>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Close proof">
            ×
          </button>
        )}
      </header>
      <p>{proof.intuition}</p>
      <h4>Given</h4>
      <ul>
        {proof.givens.map((given) => (
          <li key={given}>{given}</li>
        ))}
      </ul>
      {proof.assumptions?.length ? (
        <p>
          <strong>Assume:</strong> {proof.assumptions.join(", ")}
        </p>
      ) : null}
      <h4>Why it works</h4>
      {proof.claims.map((claim) => (
        <button
          className="proof-claim"
          type="button"
          key={claim.id}
          onMouseEnter={() => onHighlight?.(claim.highlightObjectIds)}
          onFocus={() => onHighlight?.(claim.highlightObjectIds)}
          onMouseLeave={() => {
            if (selectedClaimId !== claim.id) onHighlight?.([]);
          }}
          onBlur={() => {
            if (selectedClaimId !== claim.id) onHighlight?.([]);
          }}
          aria-pressed={selectedClaimId === claim.id}
          onClick={() => {
            const selected =
              selectedClaimId === claim.id ? undefined : claim.id;
            setSelectedClaimId(selected);
            onHighlight?.(selected ? claim.highlightObjectIds : []);
          }}
        >
          {claim.text}
          {claim.mathLatex && <code>{claim.mathLatex}</code>}
        </button>
      ))}
      <p className="proof-conclusion">
        <strong>Therefore:</strong> {proof.conclusion}
      </p>
    </article>
  );
}
