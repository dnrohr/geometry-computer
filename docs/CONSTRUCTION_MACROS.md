# Construction macros

Addition concatenates directed inputs; subtraction reverses the second. Multiplication lays out a unit ratio and copies a parallel to obtain `z/y = x/1`. Division reverses that scale. Square invokes the product construction with equal operands while retaining operation kind `square`. Square root builds the semicircle over `1+x`, the perpendicular at the join, and selects the nonnegative intersection branch.

Every macro produces a macro step, semantic objects, reveal actions, dependency links, and a proof reference. Invalid domain inputs fail before partial geometry is returned.
