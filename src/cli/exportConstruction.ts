import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { compileExpression } from "../domain/compiler/compileExpression";
import { constructionJson } from "../domain/export/exportConstruction";
import { parseExpression } from "../domain/parser/parseExpression";
import { validateRenderDocument } from "../domain/render/validateRenderDocument";

type ExportOptions = {
  expression: string;
  values: Record<string, number>;
  output: string;
  simplified?: string;
};

export function parseValues(source: string): Record<string, number> {
  if (!source.trim()) return {};
  return Object.fromEntries(
    source.split(",").map((assignment) => {
      const [rawName, rawValue, ...extra] = assignment.split("=");
      const name = rawName?.trim();
      const value = Number(rawValue?.trim());
      if (
        extra.length ||
        !name ||
        !/^[A-Za-z]+$/.test(name) ||
        rawValue === undefined ||
        !Number.isFinite(value)
      )
        throw new Error(
          `Invalid value assignment "${assignment}"; use name=number.`,
        );
      return [name, value];
    }),
  );
}

export function parseArguments(args: string[]): ExportOptions {
  const value = (flag: string) => {
    const at = args.indexOf(flag);
    if (at < 0 || !args[at + 1]) return undefined;
    return args[at + 1];
  };
  const expression = value("--expression");
  if (!expression)
    throw new Error(
      'Missing --expression. Example: --expression "a + b" --values a=3,b=2',
    );
  return {
    expression,
    values: parseValues(value("--values") ?? ""),
    output: value("--output") ?? "media/constructions/construction.json",
    simplified: value("--simplified"),
  };
}

export async function exportConstruction(options: ExportOptions) {
  const ast = parseExpression(options.expression);
  const scene = compileExpression(
    ast,
    options.values,
    options.expression,
    options.simplified ?? options.expression,
  );
  const output = resolve(options.output);
  const document = JSON.parse(constructionJson(scene)) as unknown;
  validateRenderDocument(document);
  await mkdir(resolve(output, ".."), { recursive: true });
  await writeFile(output, JSON.stringify(document, null, 2), "utf8");
  return { output, scene };
}

async function main() {
  try {
    const { output, scene } = await exportConstruction(
      parseArguments(process.argv.slice(2)),
    );
    console.log(
      `Exported ${scene.objects.length} objects and ${scene.revealActions.length} actions to ${output}`,
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (fileURLToPath(import.meta.url) === resolve(process.argv[1] ?? ""))
  void main();
