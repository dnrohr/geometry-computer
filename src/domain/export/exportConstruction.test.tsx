import { render } from "@testing-library/react";
import { compileExpression } from "../compiler/compileExpression";
import { parseExpression } from "../parser/parseExpression";
import { SvgConstructionCanvas } from "../../render/svg/SvgConstructionCanvas";
import {
  constructionExport,
  constructionJson,
  downloadText,
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

  it("downloads the requested filename, MIME type, and content", () => {
    const createObjectURL = vi.fn((blob: Blob) => {
      void blob;
      return "blob:test";
    });
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });
    let clickedDownload: string | undefined;
    let clickedHref: string | undefined;
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function (this: HTMLAnchorElement) {
        clickedDownload = this.download;
        clickedHref = this.href;
      });
    downloadText("construction.json", '{"version":1}', "application/json");
    expect(createObjectURL).toHaveBeenCalledOnce();
    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toBe("application/json");
    expect(clickedDownload).toBe("construction.json");
    expect(clickedHref).toBe("blob:test");
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:test");
    click.mockRestore();
  });
});
