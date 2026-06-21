# Expression compiler

The parser produces a precedence-aware AST. Recursive compilation first compiles operands, reuses formatted repeated subexpressions, then emits the parent operation. `^2` normalizes to the square operation; basic all-constant subtrees can be folded with the simplification hook. The original display expression is retained independently from an example's manually supplied simplified form.

For `(3*a+b)*(a+b)`, leaves are placed once, intermediate sum/product lengths are registered, and the root result is marked with the strongest visual role. Its numeric value is evaluated from the same AST.
