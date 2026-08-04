# Origami expression-to-fold planner

The planner translates a successfully analyzed expression DAG into a deterministic `geometry-computer/origami-compute-plan` document and a playable version-1 origami session.

## Planning rules

- Nodes are visited in dependency order.
- Canonically identical subexpressions are visited once and reuse one template and fold sequence.
- Constants and supplied variables are givens; operation nodes instantiate construction templates.
- Template folds are converted to `formal-axiom` guided-fold requests. The chosen candidate index is fixed by the domain plan before session or renderer compilation.
- Session fold IDs, template IDs, expression-node IDs, timing, and candidate ordering depend only on the expression and supplied values.
- Every expression node records its dependency IDs, template ID, and generated fold IDs for synchronized UI inspection.

The initial planner expands exponent zero to the unit template and exponent two to multiplication. Other integer powers are evaluated exactly by analysis but produce the recoverable `PLANNER_POWER_LIMIT` diagnostic until a bounded repeated-product layout is added.

## Failure behavior

Analysis failures, template bounds, unsupported powers, and coefficient constraints throw typed planning errors before a session is returned. The API is pure: callers can retain a previous valid plan when compilation fails. Template instantiation applies deterministic rescaling down to the documented minimum scale, then rejects values that still exceed paper bounds.

## Branches and paper state

O6 templates retain all certified real crease candidates. The selected candidate is mapped to the exact algebraic root; rejected candidates and their reason remain in the template. Session compilation applies each selected crease to the previous step's paper model, preserving face layers, sides, accumulated creases, and timing.
