import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { compileFlatFoldDocument } from "../domain/origami/compileFold";
import { solvePointToPoint } from "../domain/origami/folds";
import { applyFlatFold, rectangularPaper } from "../domain/origami/paper";
import type { MovingSide } from "../domain/origami/types";
import { validateRenderDocument } from "../domain/render/validateRenderDocument";

const argument = (args: string[], flag: string, fallback?: string) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : fallback;
};

const pair = (source: string | undefined, name: string) => {
  const values = source?.split(",").map(Number) ?? [];
  if (values.length !== 2 || values.some((value) => !Number.isFinite(value)))
    throw new Error(`${name} must contain two numbers separated by a comma.`);
  return { x: values[0], y: values[1] };
};

export async function main(args = process.argv.slice(2)) {
  const paperSize = pair(argument(args, "--paper", "10,6"), "--paper");
  const source = pair(argument(args, "--source", "0,3"), "--source");
  const target = pair(argument(args, "--target", "10,3"), "--target");
  const movingSide = argument(args, "--moving-side", "left") as MovingSide;
  if (movingSide !== "left" && movingSide !== "right")
    throw new Error("--moving-side must be left or right.");
  const output = resolve(
    argument(args, "--output", "media/constructions/origami-bisection.json")!,
  );
  const title = argument(args, "--title", "Fold one edge onto the other")!;
  const pauseBefore = Number(argument(args, "--pause-before", "0.4"));
  const pauseAfter = Number(argument(args, "--pause-after", "0.3"));
  if (
    ![pauseBefore, pauseAfter].every(
      (value) => Number.isFinite(value) && value >= 0,
    )
  )
    throw new Error("Fold pauses must be nonnegative numbers.");
  const paper = rectangularPaper(paperSize.x, paperSize.y);
  const result = applyFlatFold(
    paper,
    solvePointToPoint(source, target).creases[0],
    movingSide,
  );
  const document = compileFlatFoldDocument(result, title, {
    sourcePoint: source,
    targetPoint: target,
    pauseBefore,
    pauseAfter,
    unfold: args.includes("--unfold"),
  });
  validateRenderDocument(document);
  await mkdir(resolve(output, ".."), { recursive: true });
  await writeFile(output, JSON.stringify(document, null, 2), "utf8");
  console.log(
    `Exported ${result.movingFaces.length} computed moving face(s) to ${output}`,
  );
  return document;
}

if (fileURLToPath(import.meta.url) === resolve(process.argv[1] ?? ""))
  void main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
