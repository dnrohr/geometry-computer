import { fireEvent, render, screen, within } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders the default nested square-root construction and controls", () => {
    const { container } = render(<App />);
    expect(
      screen.getByRole("button", { name: "Compass + straightedge" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: "Flat origami roadmap" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.getByRole("heading", { name: "Geometry Computer" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Expression" })).toHaveValue(
      "sqrt(3*a - b*b)",
    );
    expect(screen.getByRole("spinbutton", { name: "a" })).toHaveValue(3);
    expect(screen.getByRole("spinbutton", { name: "b" })).toHaveValue(2);
    expect(
      screen.getByRole("img", { name: /compiled geometric construction/i }),
    ).toBeInTheDocument();
    expect(container.querySelector(".geometry-result")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Export JSON" }),
    ).toBeInTheDocument();
  });

  it("compiles input and reports invalid constructions without crashing", () => {
    render(<App />);
    const input = screen.getByRole("textbox", { name: "Expression" });
    fireEvent.change(input, { target: { value: "a+b" } });
    fireEvent.click(
      screen.getByRole("button", { name: "Compile construction" }),
    );
    expect(
      screen.getByRole("heading", { name: "Construct a + b" }),
    ).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "a/0" } });
    fireEvent.click(
      screen.getByRole("button", { name: "Compile construction" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(/division by zero/i);
    expect(
      screen.getByRole("heading", { name: "Construct a + b" }),
    ).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "a*b" } });
    fireEvent.click(
      screen.getByRole("button", { name: "Compile construction" }),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Construct a * b" }),
    ).toBeInTheDocument();
  });

  it("exposes the complete construction control contract", () => {
    render(<App />);
    const reveal = screen.getByRole("slider", { name: "Reveal progress" });
    expect(reveal).toHaveAttribute("min", "0");
    expect(reveal).toHaveAttribute("max", "1");
    expect(reveal).toHaveAttribute("step", ".01");
    const scaffolding = screen.getByRole("combobox", { name: "Scaffolding" });
    expect(scaffolding).toHaveValue("all");
    expect(
      within(scaffolding)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["Show all", "Current step", "Hide retired"]);
    ["Export JSON", "Export current SVG", "Export clean SVG"].forEach((name) =>
      expect(screen.getByRole("button", { name })).toBeInTheDocument(),
    );
  });

  it("selects gallery examples atomically", () => {
    render(<App />);
    fireEvent.click(
      screen.getByRole("button", {
        name: "Square root: sqrt(a). Geometric mean",
      }),
    );
    expect(screen.getByRole("textbox", { name: "Expression" })).toHaveValue(
      "sqrt(a)",
    );
    expect(screen.getByRole("spinbutton", { name: "a" })).toHaveValue(4);
    expect(
      screen.getByRole("heading", { name: "Construct sqrt(a)" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Reveal progress" })).toHaveValue(
      "1",
    );
    expect(screen.getAllByText(/→ 2/).length).toBeGreaterThan(0);
  });

  it("updates reveal and scaffolding without recompiling", () => {
    const { container } = render(<App />);
    const expression = screen.getByRole("textbox", { name: "Expression" });
    const reveal = screen.getByRole("slider", { name: "Reveal progress" });
    fireEvent.change(reveal, { target: { value: "0.5" } });
    expect(reveal).toHaveValue("0.5");
    const scaffolding = screen.getByRole("combobox", { name: "Scaffolding" });
    fireEvent.change(scaffolding, { target: { value: "hide-retired" } });
    expect(scaffolding).toHaveValue("hide-retired");
    expect(container.querySelector(".geometry-scaffold")).toHaveStyle({
      opacity: "0",
    });
    expect(expression).toHaveValue("sqrt(3*a - b*b)");
  });

  it("activates steps by click and bounded keyboard traversal", () => {
    const { container } = render(<App />);
    const firstStep = screen.getByRole("button", {
      name: "Place 3 Transfer this multiple of the fixed unit segment.",
    });
    fireEvent.click(firstStep);
    expect(firstStep.closest("li")).toHaveClass("active");
    fireEvent.keyDown(container.querySelector("main")!, {
      altKey: true,
      key: "ArrowDown",
    });
    expect(
      container.querySelector(".steps-panel li.active h3"),
    ).toHaveTextContent("Place a");
    fireEvent.keyDown(container.querySelector("main")!, {
      altKey: true,
      key: "ArrowUp",
    });
    expect(
      container.querySelector(".steps-panel li.active h3"),
    ).toHaveTextContent("Place 3");
  });

  it("applies and clears transient step hover", () => {
    render(<App />);
    const stepButton = screen.getByRole("button", {
      name: "Place a Use the supplied directed length.",
    });
    const stepItem = stepButton.closest("li")!;
    expect(stepItem).not.toHaveClass("active");
    fireEvent.mouseEnter(stepItem);
    expect(stepItem).toHaveClass("active");
    fireEvent.mouseLeave(stepItem);
    expect(stepItem).not.toHaveClass("active");
  });

  it("opens proofs, selects claims, and closes the proof card", () => {
    render(<App />);
    fireEvent.click(screen.getAllByRole("button", { name: "Why?" })[0]);
    expect(
      screen.getByRole("article", { name: /multiplication proof/i }),
    ).toBeInTheDocument();
    const claim = screen.getByRole("button", { name: /parallel lines make/i });
    fireEvent.click(claim);
    expect(claim).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Close proof" }));
    expect(
      screen.queryByRole("article", { name: /multiplication proof/i }),
    ).not.toBeInTheDocument();
  });

  it("opens detailed compass-and-straightedge instructions for a step", () => {
    render(<App />);
    fireEvent.click(
      screen.getByRole("button", {
        name: "Square root: sqrt(a). Geometric mean",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "How to: Draw the semicircle" }),
    );
    const card = screen.getByRole("article", {
      name: "Draw the semicircle instructions",
    });
    expect(card).toHaveTextContent(/midpoint M/i);
    expect(card).toHaveTextContent(/compass to MA/i);
    fireEvent.click(screen.getByRole("button", { name: "Close instructions" }));
    expect(
      screen.queryByRole("article", {
        name: "Draw the semicircle instructions",
      }),
    ).not.toBeInTheDocument();
  });

  it("opens and closes the inspector from geometry and expression nodes", () => {
    render(<App />);
    fireEvent.click(
      screen.getByRole("button", {
        name: "segment sqrt(3 * a - b * b)",
      }),
    );
    expect(screen.getByText("segment · result")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close inspector" }));
    expect(
      screen.getByText(/select an object in the diagram/i),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "3 * a - b * b" }));
    expect(screen.getAllByText("3 * a - b * b").length).toBeGreaterThan(1);
    expect(screen.getByText("label · intermediate")).toBeInTheDocument();
  });

  it("routes all three export buttons through downloads", () => {
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:test"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Export JSON" }));
    fireEvent.click(screen.getByRole("button", { name: "Export current SVG" }));
    fireEvent.click(screen.getByRole("button", { name: "Export clean SVG" }));
    expect(click).toHaveBeenCalledTimes(3);
    click.mockRestore();
  });

  it("opens the flat origami roadmap without changing compass constructions", () => {
    render(<App />);
    const input = screen.getByRole("textbox", { name: "Expression" });
    fireEvent.change(input, { target: { value: "a+b" } });
    fireEvent.click(
      screen.getByRole("button", { name: "Compile construction" }),
    );
    const reveal = screen.getByRole("slider", { name: "Reveal progress" });
    fireEvent.change(reveal, { target: { value: "0.42" } });
    expect(
      screen.getByRole("heading", { name: "Construct a + b" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Flat origami roadmap" }),
    );
    expect(
      screen.getByRole("heading", { name: "Origami Computer" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Do not modify the existing construction flow"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Build an origami-only arithmetic trace"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Add isolated origami domain types/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Expression" })).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: "Compass + straightedge" }),
    );
    expect(screen.getByRole("textbox", { name: "Expression" })).toHaveValue(
      "a+b",
    );
    expect(screen.getByRole("slider", { name: "Reveal progress" })).toHaveValue(
      "0.42",
    );
    expect(
      screen.getByRole("button", { name: "Export JSON" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Export current SVG" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Export clean SVG" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Construct a + b" }),
    ).toBeInTheDocument();
  });
});
