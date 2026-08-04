import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { compileFlatFoldDocument } from "../domain/origami/compileFold";
import { solveLineToLine, solvePointToPoint } from "../domain/origami/folds";
import { lineThrough } from "../domain/origami/geometry";
import { applyFlatFold, rectangularPaper } from "../domain/origami/paper";
import type { MovingSide, OrientedLine } from "../domain/origami/types";
import { validateRenderDocument } from "../domain/render/validateRenderDocument";

type Example = {
  name: string;
  title: string;
  crease: OrientedLine;
  movingSide: MovingSide;
  source: { x: number; y: number };
  target: { x: number; y: number };
  unfold?: boolean;
};

const pointFold = (
  name: string,
  title: string,
  source: { x: number; y: number },
  target: { x: number; y: number },
  movingSide: MovingSide,
  unfold = false,
): Example => ({
  name,
  title,
  source,
  target,
  movingSide,
  unfold,
  crease: solvePointToPoint(source, target).creases[0],
});

export async function main(
  outputDirectory = "media/constructions/origami-examples",
) {
  const horizontal = lineThrough({ x: 0, y: 0 }, { x: 1, y: 0 });
  const vertical = lineThrough({ x: 0, y: 0 }, { x: 0, y: 1 });
  const examples: Example[] = [
    pointFold(
      "edge-bisection",
      "Bisect the sheet edge to edge",
      { x: 0, y: 3 },
      { x: 10, y: 3 },
      "left",
    ),
    pointFold(
      "corner-to-corner",
      "Fold one corner onto the opposite corner",
      { x: 0, y: 0 },
      { x: 10, y: 6 },
      "left",
    ),
    {
      name: "angle-bisector",
      title: "Bisect a right angle by matching its edges",
      source: { x: 5, y: 0 },
      target: { x: 0, y: 5 },
      movingSide: "right",
      crease: solveLineToLine(horizontal, vertical, "internal").creases[0],
    },
    pointFold(
      "perpendicular-bisector",
      "Construct a perpendicular bisector and unfold",
      { x: 2, y: 3 },
      { x: 8, y: 3 },
      "left",
      true,
    ),
  ];
  const directory = resolve(outputDirectory);
  await mkdir(directory, { recursive: true });
  for (const example of examples) {
    const result = applyFlatFold(
      rectangularPaper(10, 6),
      example.crease,
      example.movingSide,
    );
    const document = compileFlatFoldDocument(result, example.title, {
      sourcePoint: example.source,
      targetPoint: example.target,
      unfold: example.unfold,
    });
    validateRenderDocument(document);
    await writeFile(
      resolve(directory, `${example.name}.json`),
      JSON.stringify(document, null, 2),
      "utf8",
    );
  }
  console.log(
    `Exported ${examples.length} computed origami reference scenes to ${directory}`,
  );
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
