import { fireEvent, render, screen } from "@testing-library/react";
import {
  compiledOrigamiArithmeticExamples,
  simplePointToPointFoldScene,
} from "../../../domain/origami/examples";
import { evaluateOrigamiReveal } from "../../../domain/origami/reveal/evaluateOrigamiReveal";
import { SvgOrigamiCanvas } from "./SvgOrigamiCanvas";

describe("SvgOrigamiCanvas", () => {
  it("renders accessible paper, crease, points, and reflected geometry", () => {
    const scene = simplePointToPointFoldScene();
    const { container } = render(
      <SvgOrigamiCanvas
        objects={scene.objects}
        title={scene.title}
        description={scene.description}
      />,
    );

    expect(
      screen.getByRole("img", {
        name: /Fold A onto B A minimal flat-origami scene/i,
      }),
    ).toBeInTheDocument();
    expect(container.querySelector("#origami-paper-square")).toBeInstanceOf(
      SVGElement,
    );
    expect(container.querySelector("#origami-crease-a-to-b")).toBeInstanceOf(
      SVGElement,
    );
    expect(
      container.querySelector("#origami-reflected-point-a"),
    ).toBeInstanceOf(SVGElement);
  });

  it("maps semantic roles to origami CSS classes", () => {
    const scene = simplePointToPointFoldScene();
    const { container } = render(
      <SvgOrigamiCanvas objects={scene.objects} title={scene.title} />,
    );

    expect(container.querySelector("#origami-paper-square")).toHaveClass(
      "origami-paper",
    );
    expect(container.querySelector("#origami-crease-a-to-b")).toHaveClass(
      "origami-crease",
    );
    expect(container.querySelector("#origami-reflected-point-a")).toHaveClass(
      "origami-reflection",
    );
  });

  it("applies reveal states and object highlights", () => {
    const scene = simplePointToPointFoldScene();
    const { container } = render(
      <SvgOrigamiCanvas
        objects={scene.objects}
        title={scene.title}
        renderStates={evaluateOrigamiReveal(scene.revealActions, 0.25)}
        highlightedIds={new Set(["crease-a-to-b"])}
      />,
    );

    expect(container.querySelector("#origami-crease-a-to-b")).toHaveAttribute(
      "data-draw-progress",
      "0.5",
    );
    expect(
      container.querySelector("#origami-crease-a-to-b")?.parentElement,
    ).toHaveClass("is-highlighted");
    expect(container.querySelector("#origami-reflected-point-a")).toHaveStyle({
      opacity: "0",
    });
  });

  it("supports pointer and keyboard object activation", () => {
    const scene = simplePointToPointFoldScene();
    const onSelect = vi.fn();
    const onHover = vi.fn();
    render(
      <SvgOrigamiCanvas
        objects={scene.objects}
        title={scene.title}
        onSelectObject={onSelect}
        onHoverObject={onHover}
      />,
    );

    const crease = screen.getByRole("button", {
      name: "crease crease-a-to-b",
    });
    fireEvent.mouseOver(crease);
    fireEvent.mouseOut(crease);
    fireEvent.click(crease);
    fireEvent.keyDown(crease, { key: "Enter" });
    fireEvent.keyDown(crease, { key: " " });
    expect(onHover).toHaveBeenNthCalledWith(1, "crease-a-to-b");
    expect(onHover.mock.calls.at(-1)).toEqual([]);
    expect(onSelect).toHaveBeenCalledTimes(3);
    expect(onSelect).toHaveBeenCalledWith("crease-a-to-b");
  });

  it("renders a nonempty SVG for every origami arithmetic example", () => {
    for (const { scene } of compiledOrigamiArithmeticExamples()) {
      const { container, unmount } = render(
        <SvgOrigamiCanvas objects={scene.objects} title={scene.title} />,
      );
      expect(container.querySelector("svg")).toBeInTheDocument();
      expect(
        container.querySelectorAll(".origami-object").length,
      ).toBeGreaterThan(0);
      expect(container.querySelector(".origami-crease")).toBeInTheDocument();
      unmount();
    }
  });
});
