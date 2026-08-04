import type { RenderObject } from "../../domain/render/types";

export function OrigamiObjectInspector({ object, onClose }: { object?: RenderObject; onClose: () => void }) {
  if (!object) return <section className="origami-inspector empty"><p className="section-label">Object inspector</p><p>Select a face, crease, point, arrow, or label in the fold diagram.</p></section>;
  const data = object.data;
  return <section className="origami-inspector" aria-labelledby="origami-inspector-title">
    <button type="button" className="origami-inspector-close" onClick={onClose} aria-label="Close object inspector">×</button>
    <p className="section-label">Object inspector</p><h2 id="origami-inspector-title">{object.kind}</h2>
    <dl><dt>ID</dt><dd><code>{object.id}</code></dd><dt>Role</dt><dd>{object.role}</dd><dt>Produced by</dt><dd><code>{object.createdByStepId}</code></dd>
      {data.kind === "polygon" && <><dt>Vertices</dt><dd>{data.points.length}</dd><dt>Layer</dt><dd>{data.layer ?? 0}</dd><dt>Paper side</dt><dd>{data.side ?? "front"}</dd></>}
      <dt>Dependencies</dt><dd>{object.dependsOnObjectIds.length ? object.dependsOnObjectIds.map((id) => <code key={id}>{id} </code>) : "None"}</dd>
    </dl>
  </section>;
}
