import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { vi } from "vitest";
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
    fireEvent.click(
      screen.getByRole("button", { name: "Export function animation JSON" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Export function current SVG" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Export function final SVG" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Export origami SVG" }));
    expect(click).toHaveBeenCalledTimes(8);
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
      within(functionPanel).getByText("f(a) = sqrt(a + 1)"),
    ).toBeInTheDocument();
    expect(
      within(functionPanel).getByText("6/14 fallback phases, 8 certified"),
    ).toBeInTheDocument();
    expect(
      within(functionPanel).getByText(
        "6 of 14 function animation phases still need physical fold-solver support.",
      ),
    ).toBeInTheDocument();
    expect(
      within(functionPanel).getByText(
        "origami-function-phase-9 align-fold arithmetic-macro-fold",
      ),
    ).toBeInTheDocument();
    expect(
      within(functionPanel).getByText("paper-placement origami-function-paper"),
    ).toBeInTheDocument();
    expect(
      within(functionPanel).getByText(
        "The paper boundary is placed as the fixed computation domain.",
      ),
    ).toBeInTheDocument();
    expect(
      within(functionPanel).getByRole("textbox", {
        name: "Origami function share block",
      }),
    ).toHaveValue(
      [
        "f(a) = sqrt(a + 1)",
        "Samples: a=3",
        "Domain assumption: sampled inputs stay inside the real origami function field",
        "Result: 2.000",
        "Fold solver: 6/14 fallback phases, 8 certified",
        "Animation: origami-function-phase-1 @ 0.00",
      ].join("\n"),
    );
    expect(
      within(functionPanel).getByRole("button", {
        name: "Copy function share block",
      }),
    ).toBeInTheDocument();
    expect(
      within(functionPanel).getByRole("slider", { name: "a sample slider" }),
    ).toHaveValue("3");
    expect(
      within(functionPanel).getByRole("spinbutton", {
        name: "a sample value",
      }),
    ).toHaveValue(3);
    expect(
      screen.getByRole("img", {
        name: "Origami function animation: f(a) = sqrt(a + 1)",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Export function current SVG" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Export function final SVG" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: "Origami function animation: f(a) = sqrt(a + 1)",
      }),
    ).toHaveAttribute("data-phase-id", "origami-function-phase-1");
    expect(
      screen.getByRole("slider", { name: "Function animation progress" }),
    ).toHaveValue("0");
    expect(
      screen.getByRole("button", { name: "Play function animation" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Solver work backlog" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", {
        name: "Jump to solver work origami-function-phase-9",
      }),
    );
    expect(
      screen.getByRole("button", {
        name: "Jump to solver work origami-function-phase-9",
      }),
    ).toHaveAttribute("aria-current", "step");
    expect(
      screen.getByRole("slider", { name: "Function animation progress" }),
    ).toHaveValue(String(8 / 14));
    expect(
      within(functionPanel).getByText("origami-function-phase-9 @ 0.57"),
    ).toBeInTheDocument();
    expect(
      (
        within(functionPanel).getByRole("textbox", {
          name: "Origami function share block",
        }) as HTMLTextAreaElement
      ).value,
    ).toContain("Animation: origami-function-phase-9 @ 0.57");
    expect(
      within(functionPanel).getByText(
        "sqrt:align-fold positive-geometric-mean-branch",
      ),
    ).toBeInTheDocument();
    expect(
      within(functionPanel).getByText(
        "sqrt(a + 1) uses the Positive geometric-mean branch macro, which is not yet backed by a physical fold solver.",
      ),
    ).toBeInTheDocument();
    expect(
      within(functionPanel).getByText("origami-function-node-output-3"),
    ).toBeInTheDocument();
    expect(
      within(functionPanel).getByText(
        "origami-function-node-output-4-align-fold",
      ),
    ).toBeInTheDocument();
    expect(
      within(functionPanel).queryByText(
        "paper-placement origami-function-paper",
      ),
    ).toBeNull();
    expect(
      screen.getByRole("group", { name: "Paper style" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Function paper front color")).toHaveValue(
      "#f7f0d4",
    );
    expect(
      screen.getByRole("complementary", {
        name: "Static crease-pattern comparison",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View trace" })).toHaveAttribute(
      "href",
      "#origami-trace",
    );
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
      within(functionPanel).getByText(
        /Denominator b - b: Division by zero is outside the sampled origami function domain\./,
      ),
    ).toBeInTheDocument();
    expect(
      within(functionPanel).getByRole("button", {
        name: "Compile origami function",
      }),
    ).toBeDisabled();
    expect(
      within(functionPanel).getByRole("button", {
        name: "Preview fold animation",
      }),
    ).toBeDisabled();
    expect(
      within(functionPanel).getByText("origami-function-plan-f-a-sqrt-a-1"),
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

  it("shows radicand issues inline without replacing the last valid function plan", () => {
    render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: "Flat origami roadmap" }),
    );

    const functionPanel = screen.getByRole("region", {
      name: "Fold-computed function",
    });
    fireEvent.change(
      within(functionPanel).getByRole("textbox", {
        name: "Origami function",
      }),
      { target: { value: "sqrt(a-b)" } },
    );
    fireEvent.change(
      within(functionPanel).getByRole("spinbutton", {
        name: "a sample value",
      }),
      { target: { value: "1" } },
    );
    fireEvent.change(
      within(functionPanel).getByRole("spinbutton", {
        name: "b sample value",
      }),
      { target: { value: "2" } },
    );

    expect(within(functionPanel).getByText("blocked")).toBeInTheDocument();
    expect(
      within(functionPanel).getByText(
        /Radicand a - b: Square roots need a nonnegative sampled radicand/,
      ),
    ).toBeInTheDocument();
    expect(
      within(functionPanel).getByText("origami-function-plan-f-a-sqrt-a-1"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Expression" })).toBeNull();
  });

  it("controls the origami function animation timeline locally", () => {
    render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: "Flat origami roadmap" }),
    );

    fireEvent.change(
      screen.getByRole("slider", { name: "Function animation progress" }),
      { target: { value: "0.5" } },
    );
    expect(
      screen.getByText("origami-function-phase-8 @ 0.50"),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Next function phase" }),
    );
    expect(
      screen.getByText("origami-function-phase-9 @ 0.57"),
    ).toBeInTheDocument();

    fireEvent.change(
      screen.getByRole("combobox", { name: "Function animation speed" }),
      { target: { value: "2" } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Play function animation" }),
    );
    expect(
      screen.getByRole("button", { name: "Pause function animation" }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("checkbox", { name: "Function reduced motion" }),
    );
    expect(
      screen.getByRole("button", { name: "Play function animation" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Expression" })).toBeNull();
  });

  it("supports keyboard control for the origami animation timeline", () => {
    render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: "Flat origami roadmap" }),
    );
    const timeline = screen.getByLabelText("Origami function timeline");

    fireEvent.keyDown(timeline, { key: "ArrowRight" });
    expect(
      screen.getByText("origami-function-phase-2 @ 0.07"),
    ).toBeInTheDocument();
    fireEvent.keyDown(timeline, { key: "ArrowLeft" });
    expect(
      screen.getByText("origami-function-phase-1 @ 0.00"),
    ).toBeInTheDocument();
    fireEvent.keyDown(timeline, { key: " " });
    expect(
      screen.getByRole("button", { name: "Pause function animation" }),
    ).toBeInTheDocument();
    expect(timeline).toHaveAttribute(
      "aria-keyshortcuts",
      "ArrowLeft ArrowRight Space",
    );
    expect(
      screen.getByRole("button", {
        name: /Trace a Mark the supplied input length/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "paper-boundary paper-square",
      }),
    ).toBeInTheDocument();
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
    ).toHaveValue("f(a,b)=a*b");
    expect(within(functionPanel).getByText("6.000")).toBeInTheDocument();
    expect(
      within(functionPanel).getByText("origami-function-plan-f-a-b-a-b"),
    ).toBeInTheDocument();

    fireEvent.click(
      within(functionPanel).getByRole("button", {
        name: /Offset quotient f\(a,b,c\)=\(a\+b\)\/\(c\+1\)/i,
      }),
    );
    expect(
      within(functionPanel).getByRole("textbox", { name: "Origami function" }),
    ).toHaveValue("f(a,b,c)=(a+b)/(c+1)");
    expect(within(functionPanel).getByText("2.500")).toBeInTheDocument();
    expect(
      within(functionPanel).getByText("origami-function-plan-f-a-b-c-a-b-c-1"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Expression" })).toBeNull();
  });

  it("updates origami function paper style controls locally", () => {
    const { container } = render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: "Flat origami roadmap" }),
    );

    fireEvent.change(screen.getByLabelText("Function paper front color"), {
      target: { value: "#ffffff" },
    });
    fireEvent.change(screen.getByLabelText("Function paper back color"), {
      target: { value: "#101820" },
    });
    fireEvent.change(
      screen.getByRole("combobox", { name: "Function paper front pattern" }),
      { target: { value: "washi-wave" } },
    );
    fireEvent.change(
      screen.getByRole("combobox", { name: "Function paper back pattern" }),
      { target: { value: "high-contrast" } },
    );
    fireEvent.change(screen.getByLabelText("Function paper opacity"), {
      target: { value: "0.65" },
    });
    fireEvent.change(screen.getByLabelText("Function paper pattern scale"), {
      target: { value: "1.75" },
    });
    fireEvent.change(screen.getByLabelText("Function paper pattern rotation"), {
      target: { value: "45" },
    });

    expect(screen.getByLabelText("Function paper front color")).toHaveValue(
      "#ffffff",
    );
    expect(screen.getByLabelText("Function paper back color")).toHaveValue(
      "#101820",
    );
    expect(
      screen.getByRole("combobox", { name: "Function paper front pattern" }),
    ).toHaveValue("washi-wave");
    expect(
      screen.getByRole("combobox", { name: "Function paper back pattern" }),
    ).toHaveValue("high-contrast");
    expect(container.querySelector(".origami-function-paper-base")).toHaveStyle(
      {
        fill: "#ffffff",
        opacity: "0.65",
      },
    );
    expect(screen.getByLabelText("Function paper pattern scale")).toHaveValue(
      "1.75",
    );
    expect(
      screen.getByLabelText("Function paper pattern rotation"),
    ).toHaveValue("45");
    expect(
      container.querySelector(".origami-function-paper-front-pattern"),
    ).toHaveAttribute("data-pattern-scale", "1.75");
    expect(
      container.querySelector(".origami-function-paper-front-pattern"),
    ).toHaveAttribute("data-pattern-rotation", "45");
    expect(screen.queryByRole("textbox", { name: "Expression" })).toBeNull();
  });

  it("updates origami sampled values through variable controls", () => {
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
    fireEvent.change(
      within(functionPanel).getByRole("slider", {
        name: "a sample slider",
      }),
      { target: { value: "4" } },
    );
    expect(within(functionPanel).getByText("8.000")).toBeInTheDocument();
    expect(
      within(functionPanel).getByRole("spinbutton", {
        name: "a sample value",
      }),
    ).toHaveValue(4);

    fireEvent.change(
      within(functionPanel).getByRole("spinbutton", {
        name: "b sample value",
      }),
      { target: { value: "1.5" } },
    );
    expect(within(functionPanel).getByText("6.000")).toBeInTheDocument();
    expect(
      within(functionPanel).getByRole("slider", { name: "b sample slider" }),
    ).toHaveValue("1.5");
    expect(within(functionPanel).getAllByText(/a=4, b=1.5/).length).toBe(2);
    expect(screen.queryByRole("textbox", { name: "Expression" })).toBeNull();
  });

  it("repopulates function preset controls without removing trace presets", () => {
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
    fireEvent.change(
      within(functionPanel).getByRole("spinbutton", {
        name: "a sample value",
      }),
      { target: { value: "4" } },
    );
    fireEvent.change(
      within(functionPanel).getByRole("spinbutton", {
        name: "b sample value",
      }),
      { target: { value: "1.5" } },
    );

    fireEvent.click(
      within(functionPanel).getByRole("button", {
        name: /Shifted root f\(x\)=sqrt\(x\+1\)/i,
      }),
    );
    expect(
      within(functionPanel).getByRole("textbox", { name: "Origami function" }),
    ).toHaveValue("f(x)=sqrt(x+1)");
    expect(
      within(functionPanel).getByRole("spinbutton", {
        name: "x sample value",
      }),
    ).toHaveValue(3);
    expect(
      within(functionPanel).queryByRole("spinbutton", {
        name: "a sample value",
      }),
    ).toBeNull();

    fireEvent.click(
      within(functionPanel).getByRole("button", {
        name: /Offset quotient f\(a,b,c\)=\(a\+b\)\/\(c\+1\)/i,
      }),
    );
    expect(
      within(functionPanel).getByRole("spinbutton", {
        name: "a sample value",
      }),
    ).toHaveValue(3);
    expect(
      within(functionPanel).getByRole("spinbutton", {
        name: "b sample value",
      }),
    ).toHaveValue(2);
    expect(
      within(functionPanel).getByRole("spinbutton", {
        name: "c sample value",
      }),
    ).toHaveValue(1);
    expect(within(functionPanel).getByText("2.500")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Multiplication trace" }),
    ).toBeInTheDocument();
  });

  it("copies normalized origami function readouts", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: "Flat origami roadmap" }),
    );
    const functionPanel = screen.getByRole("region", {
      name: "Fold-computed function",
    });

    fireEvent.click(
      within(functionPanel).getByRole("button", {
        name: "Copy result label",
      }),
    );
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith("f(a) = sqrt(a + 1)"),
    );
    expect(
      within(functionPanel).getByText("Copied result label"),
    ).toBeInTheDocument();

    fireEvent.click(
      within(functionPanel).getByRole("button", {
        name: "Copy sampled result",
      }),
    );
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        "f(a) = sqrt(a + 1) with a=3 => 2.000",
      ),
    );
    expect(
      within(functionPanel).getByText("Copied sampled result"),
    ).toBeInTheDocument();

    fireEvent.click(
      within(functionPanel).getByRole("button", {
        name: "Copy function share block",
      }),
    );
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        [
          "f(a) = sqrt(a + 1)",
          "Samples: a=3",
          "Domain assumption: sampled inputs stay inside the real origami function field",
          "Result: 2.000",
          "Fold solver: 6/14 fallback phases, 8 certified",
          "Animation: origami-function-phase-1 @ 0.00",
        ].join("\n"),
      ),
    );
    expect(
      within(functionPanel).getByText("Copied function share block"),
    ).toBeInTheDocument();
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
      { target: { value: "f(a,b)=a+b" } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Compile origami function" }),
    );
    expect(
      screen.getByText("origami-function-plan-f-a-b-a-b"),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Preview fold animation" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Preview fold animation" }),
    );
    expect(
      screen.getByText("origami-function-phase-5 @ 0.50"),
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
    ).toHaveValue("f(a,b)=a+b");
    expect(
      screen.getByText("origami-function-phase-5 @ 0.50"),
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
