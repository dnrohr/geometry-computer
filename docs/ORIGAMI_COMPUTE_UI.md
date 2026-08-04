# General-compute Origami UI

The Origami top-level tab now begins with an independent general-compute panel. Guided authoring, built-in fold examples, session editing, 2D and 3D views, inspection, and Manim export remain available below it.

The panel accepts an expression and comma-separated exact numeric assignments such as `a=8, b=9`. Compilation is explicit. Successful compilation replaces the Origami session and starts its independent timeline; a failure leaves the previous valid result and session unchanged.

The result summary distinguishes symbolic, exact polynomial-and-interval, and decimal presentations. It also reports constructibility class, algebraic degree, required Huzita–Hatori axioms, and fold count. Example buttons cover rational arithmetic, square roots, cube roots, mixed expressions, and a three-real-root cubic.

The expression-to-fold trace lists stable normalized DAG nodes. Origami-only nodes have a distinct marker. Selecting a node seeks the Origami session to its first associated fold. Euclidean input, values, construction, selection, and reveal progress remain mounted independently when switching tabs.

The panel is keyboard-operable, uses native labeled controls, exposes errors as alerts, and participates in the existing responsive and high-contrast styles.
