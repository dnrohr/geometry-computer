# Exact origami algebra kernel

The general-compute algebra kernel lives in `src/domain/origami/algebra`. It is independent of paper geometry, React, WebGL, ManimGL, and floating-point rendering.

## Number identity

An `OrigamiNumber` contains:

- A primitive canonical integer defining polynomial in ascending coefficient order.
- An exact rational isolating interval.
- A decimal approximation used only for root selection and presentation.
- An algebraic operation-provenance DAG.

Rational numbers use the canonical linear polynomial `denominator*x - numerator` and an exact point interval. Irrational values use a defining polynomial and a Sturm-certified interval containing exactly one distinct real root.

Defining polynomials are not required to be minimal. Exact equality computes the rational-polynomial GCD and then determines whether the certified intervals identify a common real root. It therefore does not equate numbers merely because displayed decimals are close.

## Exact operations

The kernel supports:

- Normalized arbitrary-precision rational arithmetic.
- Negation, addition, subtraction, multiplication, reciprocal, and division.
- Nonnegative real square roots.
- Real cube roots.
- Exact comparison when isolating intervals prove the order.
- Canonical JSON serialization and validation on load.

Rational translations and scaling use direct polynomial transformations. General algebraic sums and products use exact Sylvester resultants. Square and cube roots substitute `x^2` or `x^3` into the defining polynomial. Result polynomials are normalized before identity or serialization.

## Root isolation

Numeric root discovery recursively partitions the real line using derivative critical points and a Cauchy root bound. Repeated roots are detected at critical points. The selected root receives dyadic rational bounds, and an exact rational Sturm sequence must certify that the interval contains exactly one distinct real root before construction succeeds.

Serialized intervals are checked again when loaded. Rational documents must contain their exact point interval.

## Complexity limits

- Maximum defining-polynomial degree: `12`.
- Maximum coefficient size: `256` bits.
- Maximum Sylvester resultant matrix: `8 × 8`.

Operations that exceed these limits fail explicitly rather than silently switching to approximate algebra. These are implementation limits, not claims that the mathematical value is non-constructible.

## Presentation

- `exactText` shows a rational or defining polynomial with its rational isolating interval.
- `symbolicText` reconstructs a readable expression from provenance.
- `decimalText` produces a configurable approximate presentation.

The exact and decimal forms should always be labeled separately in future UI work.
