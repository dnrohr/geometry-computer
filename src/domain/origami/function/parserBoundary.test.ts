import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { parseOrigamiExpression } from "./parserBoundary";

const root = process.cwd();

const productionFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return productionFiles(path);
    if (!/\.(ts|tsx)$/.test(entry.name) || /\.test\.(ts|tsx)$/.test(entry.name))
      return [];
    return [path];
  });

const relativePath = (path: string) =>
  relative(root, path).split(sep).join("/");

describe("origami parser boundary", () => {
  it("normalizes parsed expressions through the origami-owned boundary", () => {
    expect(parseOrigamiExpression("sqrt(a+1)")).toMatchObject({
      expressionSource: "sqrt(a + 1)",
      functionName: "f",
      normalizedSource: "f(a) = sqrt(a + 1)",
      variables: ["a"],
      ast: {
        kind: "sqrt",
      },
    });
  });

  it("accepts optional function signatures and normalizes display names", () => {
    expect(parseOrigamiExpression("g(a,b)=a*b")).toMatchObject({
      expressionSource: "a * b",
      functionName: "g",
      normalizedSource: "g(a, b) = a * b",
      signatureVariables: ["a", "b"],
      variables: ["a", "b"],
    });
  });

  it("rejects signatures that do not match expression variables", () => {
    expect(() => parseOrigamiExpression("f(a)=a+b")).toThrow(
      "Function signature variables must match the expression variables.",
    );
    expect(() => parseOrigamiExpression("f(a,a)=a")).toThrow(
      "Function signature variables must be unique.",
    );
  });

  it("keeps shared parser imports behind the origami function boundary", () => {
    const origamiFiles = productionFiles(join(root, "src/domain/origami"));
    const parserImports = origamiFiles
      .filter((path) => path.endsWith("parserBoundary.ts") === false)
      .filter((path) =>
        readFileSync(path, "utf8").includes("parser/parseExpression"),
      )
      .map(relativePath);

    expect(parserImports).toEqual([]);
  });

  it("keeps origami production modules out of compass compiler, renderer, proof, and export paths", () => {
    const checkedFiles = [
      ...productionFiles(join(root, "src/domain/origami")),
      ...productionFiles(join(root, "src/render/origami")),
    ];
    const forbiddenImports = [
      "domain/compiler",
      "domain/construction",
      "domain/export",
      "render/svg",
      "ui/proofs",
      "compileExpression",
      "SvgConstructionCanvas",
      "constructionJson",
      "ProofCard",
    ];
    const matches = checkedFiles
      .map((path) => ({
        path: relativePath(path),
        text: readFileSync(path, "utf8"),
      }))
      .flatMap(({ path, text }) =>
        forbiddenImports
          .filter((pattern) => text.includes(pattern))
          .map((pattern) => `${path}: ${pattern}`),
      );

    expect(matches).toEqual([]);
  });
});
