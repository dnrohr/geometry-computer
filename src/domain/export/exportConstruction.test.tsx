import { render } from "@testing-library/react";
import { compileExpression } from "../compiler/compileExpression";
import { parseExpression } from "../parser/parseExpression";
import { SvgConstructionCanvas } from "../../render/svg/SvgConstructionCanvas";
import {
  constructionExport,
  constructionJson,
  serializeSvg,
} from "./exportConstruction";

describe("construction export", () => {
  const scene = compileExpression(parseExpression("a*b"), { a: 2, b: 3 });

  it("round-trips JSON into a renderable scene", () => {
    const restored = JSON.parse(constructionJson(scene)) as ReturnType<
      typeof constructionExport
    >;
    const { container } = render(
      <SvgConstructionCanvas
        objects={restored.objects}
        viewBox={restored.viewBox}
        title="Restored construction"
      />,
    );
    expect(restored.version).toBe(1);
    expect(container.querySelectorAll("[data-object-id]")).toHaveLength(
      scene.objects.length,
    );
  });

  it("serializes self-contained current and clean SVG states", () => {
    const { container } = render(
      <SvgConstructionCanvas
        objects={scene.objects}
        viewBox={scene.viewBox}
        title={scene.title}
        expressionSummary="a * b = 6"
      />,
    );
    const svg = container.querySelector("svg")!;
    expect(serializeSvg(svg)).toContain("<style>");
    const clean = serializeSvg(svg, true);
    expect(clean).toContain('data-export-summary="true"');
    expect(clean).toContain("a * b = 6");
    expect(clean).toContain('display="none"');
  });
});
