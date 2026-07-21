import { render, screen } from "@testing-library/react";
import {
  advanceOrigamiFunctionPreview,
  compileOrigamiFunctionPreview,
  setOrigamiFunctionPreviewPaperStyle,
  setOrigamiFunctionPreviewProgress,
} from "../../../domain/origami/function";
import { SvgOrigamiFunctionAnimation } from "./SvgOrigamiFunctionAnimation";

describe("SvgOrigamiFunctionAnimation", () => {
  it("renders a separate accessible SVG animation for compiled function plans", () => {
    const preview = compileOrigamiFunctionPreview("f(a,b)=a*b");
    if (preview.status !== "compiled") throw new Error("Expected compiled");

    const { container } = render(
      <SvgOrigamiFunctionAnimation preview={preview} />,
    );

    expect(
      screen.getByRole("img", {
        name: "Origami function animation: f(a, b) = a * b",
      }),
    ).toBeInTheDocument();
    expect(
      container.querySelector(".origami-function-moving-panel"),
    ).toBeInTheDocument();
    expect(
      container.querySelector(".origami-function-hinge"),
    ).toBeInTheDocument();
    expect(
      container.querySelector(".origami-function-paper-front"),
    ).toBeInTheDocument();
    expect(
      container.querySelector(".origami-function-paper-front"),
    ).toHaveAttribute("data-side", "front");
    expect(
      container.querySelector(".origami-function-paper-back"),
    ).toBeInTheDocument();
    expect(
      container.querySelector(".origami-function-paper-back"),
    ).toHaveAttribute("data-side", "back");
    expect(
      container.querySelector(".origami-function-paper-front-pattern"),
    ).toHaveAttribute("data-pattern", "grid");
    expect(
      container.querySelector(".origami-function-paper-front-pattern"),
    ).toHaveAttribute("data-pattern-scale", "1");
    expect(
      container.querySelector(".origami-function-paper-front-pattern"),
    ).toHaveAttribute("data-pattern-rotation", "0");
    expect(
      container.querySelector(".origami-function-paper-back-pattern"),
    ).toHaveAttribute("data-pattern", "diagonal-stripe");
    expect(
      container.querySelector(".origami-function-hinge-shadow"),
    ).toBeInTheDocument();
    expect(
      container.querySelector(".origami-function-moving-panel-shadow"),
    ).toBeInTheDocument();
    expect(
      container.querySelector(".origami-function-paper-stationary-edge"),
    ).toBeInTheDocument();
    expect(
      container.querySelector(".origami-function-paper-front-edge"),
    ).toBeInTheDocument();
    expect(
      container.querySelector(".origami-function-paper-back-edge"),
    ).toBeInTheDocument();
    expect(
      container.querySelector(".origami-function-hinge-highlight"),
    ).toBeInTheDocument();
    expect(screen.getByText("Current f(a, b) = a * b")).toBeInTheDocument();
    expect(screen.getByText("Value pending")).toBeInTheDocument();
    expect(screen.getByText("Final 6.000")).toBeInTheDocument();
  });

  it("uses fold-motion metadata for active animated phases", () => {
    const preview = compileOrigamiFunctionPreview("f(a,b)=a*b");
    if (preview.status !== "compiled") throw new Error("Expected compiled");
    const advanced = advanceOrigamiFunctionPreview(preview, 0.5);
    if (advanced.status !== "compiled") throw new Error("Expected compiled");

    const { container } = render(
      <SvgOrigamiFunctionAnimation preview={advanced} />,
    );

    expect(
      container.querySelector(".origami-function-active-crease"),
    ).toBeInTheDocument();
    expect(
      container.querySelector(".origami-function-active-crease-underlay"),
    ).toBeInTheDocument();
    expect(
      container.querySelector(".origami-function-crease-preview"),
    ).toBeInTheDocument();
    expect(
      container.querySelector(".origami-function-crease-underlay"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("origami-function-phase-5 preview-crease"),
    ).toBeInTheDocument();
    expect(screen.getByText("Current a * b")).toBeInTheDocument();
    expect(screen.getByText("Value 6.000")).toBeInTheDocument();
  });

  it("exposes the back side and keeps side fills distinct during fold phases", () => {
    const preview = compileOrigamiFunctionPreview("f(a,b)=a*b");
    if (preview.status !== "compiled") throw new Error("Expected compiled");
    const advanced = setOrigamiFunctionPreviewProgress(preview, 0.7);
    if (advanced.status !== "compiled") throw new Error("Expected compiled");

    const { container } = render(
      <SvgOrigamiFunctionAnimation preview={advanced} />,
    );

    const front = container.querySelector(".origami-function-paper-front");
    const back = container.querySelector(".origami-function-paper-back");
    const shadow = container.querySelector(
      ".origami-function-moving-panel-shadow",
    );

    expect(front).toHaveStyle({ fill: "#f7f0d4", opacity: "0.24" });
    expect(back).toHaveStyle({ fill: "#365f91", opacity: "1" });
    expect(shadow).toBeInTheDocument();
    expect(Number((shadow as SVGElement).style.opacity)).toBeCloseTo(0.232);
  });

  it("applies paper pattern scale and rotation to SVG patterns", () => {
    const preview = compileOrigamiFunctionPreview("f(a,b)=a*b");
    if (preview.status !== "compiled") throw new Error("Expected compiled");
    const styled = setOrigamiFunctionPreviewPaperStyle(preview, {
      patternScale: 1.75,
      patternRotation: 45,
    });
    if (styled.status !== "compiled") throw new Error("Expected compiled");

    const { container } = render(
      <SvgOrigamiFunctionAnimation preview={styled} />,
    );

    expect(
      container.querySelector("#origami-function-pattern-grid"),
    ).toHaveAttribute("patternTransform", "rotate(45) scale(1.75)");
    expect(
      container.querySelector(".origami-function-paper-front-pattern"),
    ).toHaveAttribute("data-pattern-scale", "1.75");
    expect(
      container.querySelector(".origami-function-paper-front-pattern"),
    ).toHaveAttribute("data-pattern-rotation", "45");
  });
});
