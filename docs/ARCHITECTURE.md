# Architecture

The dependency flow is parser → expression AST → recursive compiler → construction context → geometry/steps/reveals/proofs → React/SVG UI. Domain modules do not depend on React. `ConstructionContext` owns deterministic IDs, value reuse, provenance, and output collections. The compiler recursively emits child values, caches repeated formatted subexpressions, and adds operation-specific scaffolding and proofs.

To add a macro, define its domain validation, create semantic geometry with dependency IDs, register a macro step and reveal actions, link a proof, then route the corresponding AST kind through `compileExpression`. Add numeric, invalid-input, object-kind, provenance, and proof-reference tests before exposing it in the gallery.
