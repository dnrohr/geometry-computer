# Origami compute proofs and provenance

Every generated compute fold carries offline-inspectable provenance in the canonical origami session.

For each fold, the session records the stable expression-node and template IDs, formatted subexpression, exact value, integer defining polynomial, rational isolating interval, selected crease index, every real candidate's root parameter and certified residual, rejected-branch reasons, domain proof claims, and a physical folding instruction.

The UI algebra inspector presents the defining polynomial and isolating interval separately from its decimal approximation. For O6 folds it identifies the selected branch and lists alternative real creases as deliberate algebraic alternatives. Selecting an expression node seeks the session timeline to the associated fold.

Proof claims proceed in two layers:

1. The exact algebra kernel certifies the operation identity and root branch.
2. The template claim connects the exact value to formal Huzita–Hatori constraints and the selected crease.

The physical instruction asks the user to make, press, and unfold the mathematical crease. It describes ideal zero-thickness paper geometry; paper thickness, compliance, and real collision behavior are practical limitations rather than part of the mathematical certificate.

Session serialization stores provenance beside each request. Import restores it without recomputation, so an offline consumer can reconstruct the expression, algebra, candidate decision, proof, and instruction narrative.
