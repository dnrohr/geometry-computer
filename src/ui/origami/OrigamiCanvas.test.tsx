import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { compileOrigamiExample, origamiExamples } from "../../domain/origami/examples";
import { OrigamiCanvas } from "./OrigamiCanvas";

describe("OrigamiCanvas", () => {
  const document = compileOrigamiExample(origamiExamples[0]);
  const fold = document.revealActions.find(({ animation }) => animation === "fold")!;

  it("renders distinct source, midpoint, and target geometry", () => {
    const { rerender } = render(<OrigamiCanvas document={document} time={fold.start} />);
    const moving = screen.getByRole("button", { name: new RegExp(fold.objectId) });
    const source = moving.querySelector("polygon")!.getAttribute("points");
    rerender(<OrigamiCanvas document={document} time={(fold.start + fold.end) / 2} />);
    const midpoint = moving.querySelector("polygon")!.getAttribute("points");
    rerender(<OrigamiCanvas document={document} time={fold.end} />);
    const target = moving.querySelector("polygon")!.getAttribute("points");
    expect(midpoint).not.toBe(source);
    expect(target).not.toBe(midpoint);
    expect(moving).toHaveAttribute("data-motion", "moving");
  });

  it("selects objects with pointer and keyboard", () => {
    const onSelect = vi.fn();
    render(<OrigamiCanvas document={document} time={document.metadata.duration} onSelect={onSelect} />);
    const crease = screen.getByRole("button", { name: /crease/i });
    fireEvent.click(crease);
    fireEvent.keyDown(crease, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it("renders timed labels and stable view box", () => {
    const { container } = render(<OrigamiCanvas document={document} time={document.metadata.duration} />);
    expect(container.querySelector("svg")).toHaveAttribute("viewBox", document.viewBox);
    expect(container.querySelectorAll("text").length).toBeGreaterThan(0);
  });

  it("reports paper coordinates for direct point selection", () => {
    const onPaperPoint = vi.fn();
    const { container } = render(<OrigamiCanvas document={document} time={document.metadata.duration} onPaperPoint={onPaperPoint} />);
    const svg = container.querySelector("svg")!;
    vi.spyOn(svg, "getBoundingClientRect").mockReturnValue({ left: 0, top: 0, width: 100, height: 60, right: 100, bottom: 60, x: 0, y: 0, toJSON: () => ({}) });
    fireEvent.click(svg, { clientX: 50, clientY: 30 });
    expect(onPaperPoint).toHaveBeenCalledWith(expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }));
  });
});
