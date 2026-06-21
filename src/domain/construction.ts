import type { ConstructionStep } from "./expression";

export type Point = { x: number; y: number };
export type DrawingPrimitive =
  | { type: "line"; from: Point; to: Point; role?: "guide" | "result" }
  | { type: "circle"; center: Point; radius: number; role?: "guide" }
  | { type: "arc"; center: Point; radius: number; start: Point; end: Point }
  | { type: "point"; at: Point; label: string }
  | { type: "label"; at: Point; text: string; role?: "result" };

export type ConstructionDrawing = {
  title: string;
  method: string;
  primitives: DrawingPrimitive[];
};

const p = (x: number, y: number): Point => ({ x, y });
const line = (
  from: Point,
  to: Point,
  role?: "guide" | "result",
): DrawingPrimitive => ({ type: "line", from, to, role });
const point = (x: number, y: number, label: string): DrawingPrimitive => ({
  type: "point",
  at: p(x, y),
  label,
});
const label = (
  x: number,
  y: number,
  text: string,
  role?: "result",
): DrawingPrimitive => ({ type: "label", at: p(x, y), text, role });

function segmentDrawing(step: ConstructionStep): ConstructionDrawing {
  const [a, b] = step.operands;
  const split = step.operation === "add" ? 300 : 420;
  const resultEnd = step.operation === "add" ? 540 : 300;
  return {
    title:
      step.operation === "add" ? "Segment concatenation" : "Segment difference",
    method:
      step.operation === "add"
        ? "Transfer both lengths onto the same ray, placing the second at the end of the first."
        : "Transfer both lengths from the same origin; the interval between their endpoints is the difference.",
    primitives: [
      line(p(90, 190), p(550, 190), "guide"),
      line(p(90, 190), p(resultEnd, 190), "result"),
      point(90, 190, "O"),
      point(split, 190, "A"),
      point(resultEnd, 190, "B"),
      label(190, 165, a.reference),
      label(410, 165, b.reference),
      label(300, 235, `${step.id} = ${format(step.value)}`, "result"),
    ],
  };
}

function similarTrianglesDrawing(step: ConstructionStep): ConstructionDrawing {
  const [a, b] = step.operands;
  const product = step.operation === "multiply";
  return {
    title: product ? "Fourth proportional" : "Third proportional",
    method: product
      ? "Place unit and the first length on two rays. A parallel through the second length transfers their ratio to produce the product."
      : "Place the divisor and unit on two rays. A parallel transfers the dividend-to-divisor ratio to produce the quotient.",
    primitives: [
      line(p(100, 285), p(555, 285), "guide"),
      line(p(100, 285), p(335, 65), "guide"),
      line(p(250, 285), p(260, 135), "guide"),
      line(p(455, 285), p(430, 75), "guide"),
      line(p(100, 285), p(455, 285), "result"),
      point(100, 285, "O"),
      point(250, 285, product ? "1" : b.reference),
      point(455, 285, step.id),
      point(260, 135, product ? a.reference : "1"),
      point(430, 75, product ? b.reference : a.reference),
      label(330, 325, `${step.id} = ${format(step.value)}`, "result"),
    ],
  };
}

function squareRootDrawing(step: ConstructionStep): ConstructionDrawing {
  const [a] = step.operands;
  return {
    title: "Geometric mean",
    method:
      "Append a unit segment to the radicand, draw the semicircle on the combined diameter, then erect a perpendicular at their junction.",
    primitives: [
      line(p(90, 270), p(550, 270), "guide"),
      {
        type: "arc",
        center: p(320, 270),
        radius: 230,
        start: p(90, 270),
        end: p(550, 270),
      },
      line(p(400, 270), p(400, 55), "result"),
      point(90, 270, "O"),
      point(400, 270, "A"),
      point(550, 270, "B"),
      point(400, 55, step.id),
      label(235, 300, a.reference),
      label(475, 300, "1"),
      label(430, 155, `${step.id} = ${format(step.value)}`, "result"),
    ],
  };
}

function format(value: number): string {
  return Number(value.toPrecision(6)).toString();
}

export function createConstructionDrawing(
  step: ConstructionStep,
): ConstructionDrawing {
  if (step.operation === "add" || step.operation === "subtract") {
    return segmentDrawing(step);
  }
  if (step.operation === "sqrt") {
    return squareRootDrawing(step);
  }
  return similarTrianglesDrawing(step);
}
