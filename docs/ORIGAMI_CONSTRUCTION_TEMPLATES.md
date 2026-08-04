# Origami construction templates

Construction templates are renderer-independent domain objects that connect exact algebraic values to bounded paper geometry. Each instance records its input algebraic numbers, exact output, coordinate frame, paper and safe-margin policy, formal axiom requests, selected and rejected candidates, unfold behavior, preconditions, degeneracies, and proof claims.

## Supported operations

The initial registry covers unit placement, addition, subtraction, multiplication, division, reciprocal, square root, real cube root, and explicitly selected cubic roots. Field-operation and square-root templates establish a certified directed result mark and perpendicular reference crease. Cube-root and cubic-root templates use an O6 simultaneous point-to-line fold.

## Cubic-to-O6 mapping

For a monic cubic

```text
p(x) = x^3 + B*x^2 + C*x + D
```

choose the first point `(0,1)` with the x-axis as its target. Choose the second point

```text
((D-B)/2, (1+C)/2)
```

and the vertical target line `x = (D-B)/2-D`. Substitution into the O6 constraints produces exactly `p(t)`. Translating this setup into the template frame does not change the root parameter. Non-monic integer cubics are normalized by their leading coefficient.

All real crease candidates remain explicit. The template selects the candidate whose O6 root parameter matches the exact algebraic result's certified branch and records why other candidates were rejected.

## Bounds and verification

The standard sheet is 10 by 6 units, with a 0.25-unit safe margin, an origin at `(4,3)`, and a directed-number scale of 0.75 paper units per algebraic unit. A template that does not fit fails before modifying paper state; later planning may subdivide or rescale it.

`verifyTemplate` checks both the represented directed output and every formal axiom residual against the geometric tolerance. Renderers consume the chosen domain crease and must not solve the polynomial or choose a branch themselves.
