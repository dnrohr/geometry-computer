import { fireEvent, render, screen } from "@testing-library/react";
import {
  circleObject,
  labelObject,
  pointObject,
  segmentObject,
} from "../../domain/geometry/types";
import { SvgConstructionCanvas } from "./SvgConstructionCanvas";

const meta = (id: string, role: "input" | "scaffold") => ({
  id,
  role,
  createdByStepId: "step-test",
  usedByStepIds: [],
  dependsOnObjectIds: [],
});
const objects = [
  pointObject({ x: 10, y: 10 }, { ...meta("point", "input"), label: "A" }),
  segmentObject({ x: 10, y: 10 }, { x: 50, y: 10 }, meta("segment", "input")),
  circleObject({ x: 30, y: 30 }, 15, meta("circle", "scaffold")),
  labelObject({ x: 30, y: 60 }, "length a", meta("label", "input")),
];

describe("SvgConstructionCanvas", () => {
  it("renders points, labels, segments, and circles", () => {
    const { container } = render(
      <SvgConstructionCanvas objects={objects} title="Test construction" />,
    );
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("length a")).toBeInTheDocument();
    expect(container.querySelector("#geom-segment")).toBeInstanceOf(SVGElement);
    expect(container.querySelector("#geom-circle")).toBeInstanceOf(SVGElement);
  });

  it("maps semantic roles to CSS classes", () => {
    const { container } = render(
      <SvgConstructionCanvas objects={objects} title="Test construction" />,
    );
    expect(container.querySelector("#geom-point")).toHaveClass(
      "geometry-input",
    );
    expect(container.querySelector("#geom-circle")).toHaveClass(
      "geometry-scaffold",
    );
  });

  it("provides accessible SVG metadata and expression metadata", () => {
    render(
      <SvgConstructionCanvas
        objects={objects}
        title="Test construction"
        description="Test description"
        expressionSummary="a = 2"
      />,
    );
    const image = screen.getByRole("img", {
      name: "Test construction Test description",
    });
    expect(image).toHaveAttribute("viewBox", "0 0 760 480");
    expect(image).toHaveAttribute("data-expression", "a = 2");
  });

  it.each([
    ["all", "wrong-step", false],
    ["current", "step-test", false],
    ["current", "wrong-step", true],
    ["hide-retired", "step-test", true],
  ] as const)(
    "applies scaffold mode %s",
    (scaffoldMode, activeStepId, hidden) => {
      const { container } = render(
        <SvgConstructionCanvas
          objects={objects}
          title="Test construction"
          scaffoldMode={scaffoldMode}
          activeStepId={activeStepId}
        />,
      );
      expect(
        (container.querySelector("#geom-circle") as SVGElement).style.opacity,
      ).toBe(hidden ? "0" : "");
      expect(container.querySelector("#geom-segment")).not.toHaveStyle({
        opacity: "0",
      });
    },
  );

  it("applies hidden, partial-draw, dim, and highlight states", () => {
    const { container } = render(
      <SvgConstructionCanvas
        objects={objects}
        title="Test construction"
        highlightedIds={new Set(["point"])}
        renderStates={{
          segment: {
            visible: true,
            drawProgress: 0.5,
            opacity: 0.5,
            highlighted: false,
            dimmed: false,
          },
          circle: {
            visible: true,
            drawProgress: 0.5,
            opacity: 0.5,
            highlighted: false,
            dimmed: false,
          },
          label: {
            visible: true,
            drawProgress: 1,
            opacity: 1,
            highlighted: false,
            dimmed: true,
          },
        }}
      />,
    );
    expect(container.querySelector("#geom-segment")).toHaveAttribute(
      "data-draw-progress",
      "0.5",
    );
    expect(container.querySelector("#geom-segment")).toHaveStyle({
      strokeDashoffset: "50",
      opacity: "0.5",
    });
    expect(container.querySelector("#geom-circle")).toHaveStyle({
      opacity: "0.5",
    });
    expect(container.querySelector("#geom-circle")).not.toHaveStyle({
      strokeDasharray: "100 100",
    });
    expect(container.querySelector("#geom-label")).toHaveStyle({
      opacity: "0.25",
    });
    expect(container.querySelector("#geom-point")?.parentElement).toHaveClass(
      "is-highlighted",
    );
  });

  it("supports pointer and keyboard object activation", () => {
    const onSelect = vi.fn();
    const onHover = vi.fn();
    render(
      <SvgConstructionCanvas
        objects={objects}
        title="Test construction"
        onSelectObject={onSelect}
        onHoverObject={onHover}
      />,
    );
    const segment = screen.getByRole("button", { name: "segment segment" });
    fireEvent.mouseOver(segment);
    fireEvent.mouseOut(segment);
    fireEvent.click(segment);
    fireEvent.keyDown(segment, { key: "Enter" });
    fireEvent.keyDown(segment, { key: " " });
    expect(onHover).toHaveBeenNthCalledWith(1, "segment");
    expect(onHover.mock.calls.at(-1)).toEqual([]);
    expect(onSelect).toHaveBeenCalledTimes(3);
    expect(onSelect).toHaveBeenCalledWith("segment");
  });
});
