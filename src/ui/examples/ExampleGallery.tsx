import type { GalleryExample } from "../../domain/examples/gallery";
export function ExampleGallery({
  examples,
  onSelect,
}: {
  examples: GalleryExample[];
  onSelect: (example: GalleryExample) => void;
}) {
  return (
    <section className="gallery" aria-labelledby="gallery-title">
      <h2 id="gallery-title">Examples</h2>
      <div>
        {examples.map((example) => (
          <button
            type="button"
            key={example.name}
            aria-label={`${example.name}: ${example.expression}. ${example.note}`}
            onClick={() => onSelect(example)}
          >
            <strong>{example.name}</strong>
            <code>{example.expression}</code>
            <small>{example.note}</small>
          </button>
        ))}
      </div>
    </section>
  );
}
