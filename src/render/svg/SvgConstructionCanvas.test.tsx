import { render, screen } from "@testing-library/react";
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
});
