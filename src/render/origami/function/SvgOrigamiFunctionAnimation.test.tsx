import { render, screen } from "@testing-library/react";
import {
  advanceOrigamiFunctionPreview,
  compileOrigamiFunctionPreview,
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
      container.querySelector(".origami-function-paper-moving"),
    ).toBeInTheDocument();
    expect(
      container.querySelector(".origami-function-hinge"),
    ).toBeInTheDocument();
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
      screen.getByText("origami-function-phase-5 preview-crease"),
    ).toBeInTheDocument();
  });
});
