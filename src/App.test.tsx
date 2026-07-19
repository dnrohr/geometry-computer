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
    fireEvent.click(
      screen.getByRole("button", { name: "Flat origami roadmap" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Export origami JSON" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Export origami SVG" }));
    expect(click).toHaveBeenCalledTimes(5);
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
    expect(
      screen.getByRole("img", {
        name: /Compiled origami trace: a/i,
      }),
    ).toBeInTheDocument();
    const functionPanel = screen.getByRole("region", {
      name: "Fold-computed function",
    });
    expect(
      within(functionPanel).getByRole("textbox", { name: "Origami function" }),
    ).toHaveValue("sqrt(a+1)");
    expect(within(functionPanel).getByText("allowable")).toBeInTheDocument();
    expect(within(functionPanel).getByText("2.000")).toBeInTheDocument();
    expect(
      within(functionPanel).getByRole("button", {
        name: /Product f\(a,b\)=a\*b/i,
      }),
    ).toBeInTheDocument();
    expect(
      within(functionPanel).getByRole("button", {
        name: /Shifted root f\(x\)=sqrt\(x\+1\)/i,
      }),
    ).toBeInTheDocument();
    expect(
      within(functionPanel).getByRole("button", {
        name: /Offset quotient f\(a,b,c\)=\(a\+b\)\/\(c\+1\)/i,
      }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Multiplication trace" }),
    );
    expect(
      screen.getByRole("img", {
        name: /Compiled origami trace: a\*b/i,
      }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", {
        name: /Trace a \* b Use an intercept-style fold trace/i,
      }),
    );
    expect(screen.getByText("mul")).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole("main"), {
      altKey: true,
      key: "ArrowUp",
    });
    expect(screen.getAllByText("place-input").length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByRole("button", { name: "Why?" }).at(-1)!);
    expect(
      screen.getByRole("heading", { name: "Origami multiplication trace" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getAllByRole("button", { name: /segment a \* b/i })[0],
    );
    const inspector = screen.getByRole("complementary", {
      name: "Origami object",
    });
    expect(
      within(inspector).getByText("origami-segment-3"),
    ).toBeInTheDocument();
    expect(within(inspector).getByText("Assumptions")).toBeInTheDocument();
    expect(
      within(inspector).getByText(
        "This trace records the arithmetic dependency; detailed crease geometry is expanded in the rendering milestone.",
      ),
    ).toBeInTheDocument();
    expect(within(inspector).getByText("Selected")).toBeInTheDocument();
    expect(
      within(inspector).getByText("Intercept similar-triangle branch"),
    ).toBeInTheDocument();
    expect(within(inspector).getByText("Rejected")).toBeInTheDocument();
    expect(within(inspector).getAllByText("none").length).toBeGreaterThan(0);
    expect(within(inspector).getByText("Sample")).toBeInTheDocument();
    expect(within(inspector).getByText("6")).toBeInTheDocument();
    expect(within(inspector).getByText("Provenance")).toBeInTheDocument();
    expect(
      within(inspector).getByText(/origami-point-5, origami-point-6/),
    ).toBeInTheDocument();
    expect(within(inspector).getByText("Export IDs")).toBeInTheDocument();
    expect(
      within(inspector).getByText("origami-segment-3, origami-step-3"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Export origami JSON" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Export origami SVG" }),
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
    expect(
      screen.queryByRole("textbox", { name: "Origami function" }),
    ).toBeNull();
  });

  it("keeps origami function validation local to the flat origami tab", () => {
    render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: "Flat origami roadmap" }),
    );

    const functionInput = screen.getByRole("textbox", {
      name: "Origami function",
    });
    fireEvent.change(functionInput, { target: { value: "a/(b-b)" } });

    const functionPanel = screen.getByRole("region", {
      name: "Fold-computed function",
    });
    expect(within(functionPanel).getByText("blocked")).toBeInTheDocument();
    expect(
      within(functionPanel).getByText(
        "Division by zero is outside the sampled origami function domain.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Origami Computer" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Expression" })).toBeNull();

    fireEvent.click(
      screen.getByRole("button", { name: "Compass + straightedge" }),
    );
    expect(screen.getByRole("textbox", { name: "Expression" })).toHaveValue(
      "sqrt(3*a - b*b)",
    );
  });

  it("loads origami function examples into the function input and preview plan", () => {
    render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: "Flat origami roadmap" }),
    );
    const functionPanel = screen.getByRole("region", {
      name: "Fold-computed function",
    });

    fireEvent.click(
      within(functionPanel).getByRole("button", {
        name: /Product f\(a,b\)=a\*b/i,
      }),
    );
    expect(
      within(functionPanel).getByRole("textbox", { name: "Origami function" }),
    ).toHaveValue("a*b");
    expect(within(functionPanel).getByText("6.000")).toBeInTheDocument();
    expect(
      within(functionPanel).getByText("origami-function-plan-a-b"),
    ).toBeInTheDocument();

    fireEvent.click(
      within(functionPanel).getByRole("button", {
        name: /Offset quotient f\(a,b,c\)=\(a\+b\)\/\(c\+1\)/i,
      }),
    );
    expect(
      within(functionPanel).getByRole("textbox", { name: "Origami function" }),
    ).toHaveValue("(a+b)/(c+1)");
    expect(within(functionPanel).getByText("2.500")).toBeInTheDocument();
    expect(
      within(functionPanel).getByText("origami-function-plan-a-b-c-1"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Expression" })).toBeNull();
  });

  it("preserves compiled origami function animation state across workspace switches", () => {
    render(<App />);
    const expression = screen.getByRole("textbox", { name: "Expression" });
    fireEvent.change(expression, { target: { value: "a+b" } });
    fireEvent.click(
      screen.getByRole("button", { name: "Compile construction" }),
    );
    fireEvent.change(screen.getByRole("slider", { name: "Reveal progress" }), {
      target: { value: "0.42" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Flat origami roadmap" }),
    );
    fireEvent.change(
      screen.getByRole("textbox", { name: "Origami function" }),
      { target: { value: "a+b" } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Compile origami function" }),
    );
    expect(screen.getByText("origami-function-plan-a-b")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Preview fold animation" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Preview fold animation" }),
    );
    expect(
      screen.getByText("origami-function-phase-3 @ 0.50"),
    ).toBeInTheDocument();

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
      screen.getByRole("heading", { name: "Construct a + b" }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Flat origami roadmap" }),
    );
    expect(
      screen.getByRole("textbox", { name: "Origami function" }),
    ).toHaveValue("a+b");
    expect(
      screen.getByText("origami-function-phase-3 @ 0.50"),
    ).toBeInTheDocument();
  });

  it("shows compact origami step metadata for macro, axiom, branch, proof, and degeneracy", () => {
    render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: "Flat origami roadmap" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Multiplication trace" }),
    );
    const multiplyStep = screen
      .getByRole("button", {
        name: /Trace a \* b Use an intercept-style fold trace/i,
      })
      .closest("li")!;

    expect(within(multiplyStep).getByText("Macro")).toBeInTheDocument();
    expect(within(multiplyStep).getByText("mul")).toBeInTheDocument();
    expect(within(multiplyStep).getByText("Axiom")).toBeInTheDocument();
    expect(within(multiplyStep).getByText("macro trace")).toBeInTheDocument();
    expect(within(multiplyStep).getByText("Branch")).toBeInTheDocument();
    expect(
      within(multiplyStep).getByText("Intercept similar-triangle branch"),
    ).toBeInTheDocument();
    expect(within(multiplyStep).getByText("Proof")).toBeInTheDocument();
    expect(within(multiplyStep).getByText("linked")).toBeInTheDocument();
    expect(within(multiplyStep).getByText("Degeneracy")).toBeInTheDocument();
    expect(within(multiplyStep).getByText("none")).toBeInTheDocument();
  });

  it("links origami proof claims with canvas object highlighting", () => {
    const { container } = render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: "Flat origami roadmap" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Multiplication trace" }),
    );
    fireEvent.click(screen.getAllByRole("button", { name: "Why?" }).at(-1)!);
    const claim = screen.getByRole("button", {
      name: /Use an intercept-style fold trace to scale one length by the other.*3 objects/i,
    });

    fireEvent.click(claim);
    expect(claim).toHaveAttribute("aria-pressed", "true");
    expect(
      container.querySelector("#origami-origami-segment-3")?.parentElement,
    ).toHaveClass("is-highlighted");

    fireEvent.click(screen.getAllByRole("button", { name: /segment a/i })[0]);
    expect(
      screen.getByRole("heading", { name: "Origami multiplication trace" }),
    ).toBeInTheDocument();
    expect(claim).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps the origami explanation layout split into compact readable panels", () => {
    const { container } = render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: "Flat origami roadmap" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Multiplication trace" }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: /Trace a \* b Use an intercept-style fold trace/i,
      }),
    );
    fireEvent.click(screen.getAllByRole("button", { name: "Why?" }).at(-1)!);

    expect(
      container.querySelector(".origami-trace-layout"),
    ).toBeInTheDocument();
    expect(
      container.querySelector(".origami-canvas-panel"),
    ).toBeInTheDocument();
    expect(container.querySelector(".origami-steps-panel")).toBeInTheDocument();
    expect(container.querySelector(".origami-inspector")).toBeInTheDocument();
    expect(container.querySelector(".origami-proof-card")).toBeInTheDocument();
    expect(
      container.querySelector(".origami-step-metadata"),
    ).toBeInTheDocument();
    expect(container.querySelector(".origami-proof-claim")).toBeInTheDocument();
  });
});
