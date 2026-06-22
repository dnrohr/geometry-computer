import type { ConstructionStep } from "../../domain/construction/types";
import { constructionInstructions } from "../../domain/instructions/constructionInstructions";

export function InstructionsCard({
  step,
  onClose,
}: {
  step: ConstructionStep;
  onClose: () => void;
}) {
  return (
    <article
      className="instructions-card"
      aria-label={`${step.title} instructions`}
    >
      <header>
        <div>
          <p className="section-label">Compass & straightedge</p>
          <h3>How: {step.title}</h3>
        </div>
        <button type="button" onClick={onClose} aria-label="Close instructions">
          Close
        </button>
      </header>
      <p>{step.summary}</p>
      <ol>
        {constructionInstructions(step).map((instruction, index) => (
          <li key={`${step.id}-instruction-${index}`}>{instruction}</li>
        ))}
      </ol>
    </article>
  );
}
