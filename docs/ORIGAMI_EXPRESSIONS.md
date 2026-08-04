# Origami expression language

The Origami compute pipeline shares ordinary arithmetic syntax with the Euclidean compiler and adds explicit cube-root operations. Analysis is renderer-independent and completes before any paper geometry is planned.

## Syntax

- Constants and variables: `2`, `0.125`, `a`
- Field operations: `a + b`, `a - b`, `a * b`, `a / b`
- Integer powers: `a^3`, `a^-2`
- Nonnegative real square root: `sqrt(a)`
- Real cube root: `cbrt(a)`
- Selected real cubic root: `cubic(a,b,c,d,index)`

`cubic(a,b,c,d,index)` denotes the zero-based `index`th distinct real root, in ascending order, of `a*x^3 + b*x^2 + c*x + d = 0`.

The leading coefficient must be nonzero. Cubic coefficients must currently evaluate to rational numbers. Root selection is explicit so crease selection never depends on incidental floating-point or solver ordering.

## Exact evaluation

Finite decimal constants and supplied variable values are converted to exact base-10 rationals. Arithmetic, radicals, and cubic roots use the exact origami algebra kernel: an integer defining polynomial, a certified rational isolating interval, and operation provenance. Decimal approximations are presentation aids only.

The analyzer normalizes the expression into a deterministic dependency DAG keyed by canonical formatted subexpressions. Repeated subexpressions are evaluated once and receive one stable DAG node.

## Classification

- `euclidean`: rational field operations, integer powers, and square roots only.
- `origami-only`: at least one real cube root or selected cubic root is required.
- `invalid`: a missing variable, division by zero, non-real square root, zero cubic leading coefficient, or nonexistent selected root.
- `unsupported`: an algebraic complexity limit is exceeded or a cubic coefficient is not rational.

Diagnostics identify the first failing subexpression before construction templates or paper state are created. The Euclidean compiler explicitly redirects `cbrt` and `cubic` expressions to the Origami tab.

## Examples

```text
sqrt(a) + b / 2
cbrt(2)
cbrt(a) + sqrt(b)
cubic(1, -6, 11, -6, 1)
```
