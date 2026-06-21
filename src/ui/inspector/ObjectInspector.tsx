import type { GeomObject } from "../../domain/geometry/types";
export function ObjectInspector({
  object,
  onClose,
}: {
  object?: GeomObject;
  onClose?: () => void;
}) {
  return (
    <section className="inspector" aria-live="polite">
      <header>
        <h2>Object inspector</h2>
        {object && (
          <button type="button" onClick={onClose} aria-label="Close inspector">
            ×
          </button>
        )}
      </header>
      {object ? (
        <dl>
          <dt>Label</dt>
          <dd>{object.label ?? object.represents ?? object.id}</dd>
          <dt>Kind / role</dt>
          <dd>
            {object.kind} · {object.role}
          </dd>
          <dt>Created by</dt>
          <dd>{object.createdByStepId}</dd>
          <dt>Depends on</dt>
          <dd>{object.dependsOnObjectIds.join(", ") || "None"}</dd>
          <dt>Used by</dt>
          <dd>{object.usedByStepIds.join(", ") || "None yet"}</dd>
          <dt>Expression</dt>
          <dd>{object.represents ?? "—"}</dd>
        </dl>
      ) : (
        <p>Select an object in the diagram to inspect its provenance.</p>
      )}
    </section>
  );
}
