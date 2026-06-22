import type {
  ConstructionOpKind,
  ConstructionStep,
} from "../construction/types";

const primitiveInstructions: Record<string, string[]> = {
  "Lay off the first length": [
    "Draw a ray from the chosen origin.",
    "Open the compass to the first supplied segment, place its point at the origin, and mark where the arc meets the ray.",
  ],
  "Transfer the second length": [
    "Keep the compass opening equal to the second supplied segment.",
    "Place the compass point at the first segment's endpoint and mark the next point on the same ray.",
  ],
  "Mark the sum": [
    "Join the original starting point to the final transferred point.",
    "That complete segment is the sum of the two consecutive lengths.",
  ],
  "Mark the minuend": [
    "Copy the first supplied length onto a ray from the chosen origin.",
    "Mark its endpoint; this is where the backward transfer begins.",
  ],
  "Transfer backward": [
    "Open the compass to the subtrahend's length.",
    "With the compass point at the minuend's endpoint, mark that distance back toward the origin along the same line.",
  ],
  "Mark the difference": [
    "Join the origin to the endpoint left by the backward transfer.",
    "Read its direction as well as its length: an endpoint beyond the origin represents a negative result.",
  ],
  "Lay out the scale": [
    "Draw two rays from a shared origin at any convenient nonzero angle.",
    "Use the compass to copy the unit and one input onto the first ray, and the other input onto the second ray.",
  ],
  "Draw the parallel": [
    "Join the two reference endpoints with a straight line.",
    "At the remaining input point, copy the angle made by that connector and its ray: draw matching arcs, copy the intercepted chord, then draw the line through the copied point.",
    "The new line is parallel to the reference connector.",
  ],
  "Choose the constructed length": [
    "Extend the constructed parallel until it meets the target ray.",
    "Mark the intersection; its distance from the shared origin is the similar-triangle result.",
  ],
  "Extract the result": [
    "Open the compass to the newly constructed auxiliary segment.",
    "Transfer that opening onto the result ray and mark its endpoint.",
  ],
  "Place the unit and radicand": [
    "Draw a straight baseline and choose its left endpoint A.",
    "Copy the unit length from A to a point B, then copy the radicand from B to a point C on the same line.",
  ],
  "Draw the semicircle": [
    "From endpoints A and C, draw equal arcs of radius greater than half of AC, above and below the baseline.",
    "Draw the line through the two arc intersections; where it crosses AC is the midpoint M.",
    "Set the compass to MA, place its point at M, and draw the circle through A and C (only the upper semicircle is needed).",
  ],
  "Choose the upper intersection": [
    "With center B, draw an arc cutting the baseline at two points equally placed around B.",
    "From those two points, draw equal intersecting arcs above the line, then draw the line through their intersection and B.",
    "Mark where this perpendicular meets the upper semicircle.",
  ],
  "Extract the square root": [
    "Open the compass to the perpendicular altitude from B to the semicircle.",
    "Transfer that opening onto the result ray; the transferred segment is the positive square root.",
  ],
};

const operationInstructions: Record<ConstructionOpKind, string[]> = {
  given: [
    "Represent the supplied value by a segment measured against the chosen unit length.",
    "Copy it with the compass whenever the construction needs that value elsewhere.",
  ],
  constant: [
    "Choose or supply the reference unit segment.",
    "Use the compass to transfer the constant multiple of that unit onto the working ray.",
  ],
  add: [
    "Copy the input segments consecutively along one directed ray.",
    "The segment from the original start to the final endpoint is their sum.",
  ],
  sub: [
    "Copy the first segment forward and the second segment backward on the same directed line.",
    "The remaining directed displacement is the difference.",
  ],
  mul: [
    "Place a unit and one factor on one ray and the other factor on a second ray.",
    "Use a parallel line to create similar triangles, then transfer the resulting length.",
  ],
  div: [
    "Arrange the divisor, dividend, and unit on two rays from a shared origin.",
    "Use a parallel line to form similar triangles whose corresponding-side ratio is the quotient.",
  ],
  square: [
    "Use the multiplication construction with the same variable segment as both factors.",
    "The unit segment fixes the numerical scale of the squared result.",
  ],
  sqrt: [
    "Place the unit and radicand end to end as one diameter.",
    "Construct the diameter's midpoint and semicircle, then erect a perpendicular at the join.",
    "The altitude to the semicircle is the geometric mean, and therefore the square root.",
  ],
};

export function constructionInstructions(step: ConstructionStep): string[] {
  return (
    primitiveInstructions[step.title] ??
    (step.operation ? operationInstructions[step.operation] : [step.summary])
  );
}
