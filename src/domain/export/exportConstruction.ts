import type { CompiledScene } from "../compiler/compileExpression";
export type ConstructionExport = Pick<
  CompiledScene,
  | "expression"
  | "simplifiedExpression"
  | "values"
  | "objects"
  | "steps"
  | "revealActions"
  | "proofs"
  | "viewBox"
> & { version: 1 };
export const constructionExport = (
  scene: CompiledScene,
): ConstructionExport => ({
  version: 1,
  expression: scene.expression,
  simplifiedExpression: scene.simplifiedExpression,
  values: scene.values,
  objects: scene.objects,
  steps: scene.steps,
  revealActions: scene.revealActions,
  proofs: scene.proofs,
  viewBox: scene.viewBox,
});
export const constructionJson = (scene: CompiledScene) =>
  JSON.stringify(constructionExport(scene), null, 2);
export function downloadText(filename: string, content: string, type: string) {
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(new Blob([content], { type }));
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}
export function serializeSvg(svg: SVGSVGElement, final = false) {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  if (final)
    clone
      .querySelectorAll<SVGElement>(".geometry-scaffold,.geometry-ghost")
      .forEach((item) => item.setAttribute("display", "none"));
  if (final) {
    clone
      .querySelectorAll<SVGElement>("[style*='opacity: 0']")
      .forEach((item) => item.removeAttribute("style"));
    const expression = clone.dataset.expression;
    if (expression) {
      const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text",
      );
      text.setAttribute("x", "20");
      text.setAttribute("y", "30");
      text.setAttribute("fill", "#f0b84b");
      text.setAttribute("font-family", "serif");
      text.setAttribute("font-size", "18");
      text.setAttribute("data-export-summary", "true");
      text.textContent = expression;
      clone.append(text);
    }
  }
  return new XMLSerializer().serializeToString(clone);
}
