import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { vi } from "vitest";
import App from "./App";
import {
  compileOrigamiFunctionPreview,
  origamiFunctionAnimationJson,
  setOrigamiFunctionPreviewPaperStyle,
  setOrigamiFunctionPreviewPhase,
} from "./domain/origami/function";

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
      screen.getByRole("button", { name: "Show export and paper style" }),
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
    fireEvent.click(
      screen.getByRole("button", { name: "Export function crease SVG" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Export function animated SVG" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Export origami SVG" }));
    expect(click).toHaveBeenCalledTimes(10);
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
    const workspaceModes = screen.getByRole("region", {
      name: "Origami workspace modes",
    });
    expect(
      within(workspaceModes).getByText("Typed function lab"),
    ).toBeInTheDocument();
    expect(
      within(workspaceModes).getByText("Function-computation animation"),
    ).toBeInTheDocument();
    expect(
      within(workspaceModes).getByText("Trace gallery"),
    ).toBeInTheDocument();
    expect(
      within(workspaceModes).getByText("Arithmetic-fold inspector"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Trace gallery").length).toBeGreaterThan(1);
    expect(
      screen.queryByText("Do not modify the existing construction flow"),
    ).toBeNull();
    expect(
      screen.queryByText("Build an origami-only arithmetic trace"),
    ).toBeNull();
    expect(screen.queryByText(/Add isolated origami domain types/i)).toBeNull();
    expect(
      screen.getByRole("button", { name: "Show development notes" }),
    ).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(
      screen.getByRole("button", { name: "Show development notes" }),
    );
    expect(
      screen.getByRole("region", { name: "Origami development notes" }),
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
    expect(within(functionPanel).queryByText("Sample values")).toBeNull();
    expect(within(functionPanel).queryByText("Fold solver")).toBeNull();
    expect(within(functionPanel).queryByText("Certificate detail")).toBeNull();
    expect(
      within(functionPanel).getByRole("button", { name: "Show diagnostics" }),
    ).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(
      within(functionPanel).getByRole("button", { name: "Show diagnostics" }),
    );
    expect(
      within(functionPanel).getByRole("region", {
        name: "Origami function diagnostics",
      }),
    ).toBeInTheDocument();
    expect(within(functionPanel).getAllByText("ready").length).toBeGreaterThan(
      0,
    );
    expect(
      within(functionPanel).getByText(
        "All function animation phases are backed by physical fold steps.",
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
        "Fold solver: ready",
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
      screen.queryByRole("button", { name: "Export function current SVG" }),
    ).toBeNull();
    expect(
      screen.queryByLabelText("Function paper front color"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Show export and paper style" }),
    ).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(
      screen.getByRole("button", { name: "Show export and paper style" }),
    );
    expect(
      screen.getByRole("region", {
        name: "Origami function export and paper style",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Export function current SVG" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Export function final SVG" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Export function crease SVG" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Export function animated SVG" }),
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
      screen.queryByRole("heading", { name: "Solver work backlog" }),
    ).toBeNull();
    fireEvent.click(
      screen.getByRole("button", {
        name: "Jump to function phase origami-function-phase-9",
      }),
    );
    expect(
      screen.getByRole("button", {
        name: "Jump to function phase origami-function-phase-9",
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
        "geometric-mean-square-root origami-function-node-output-4-align-fold",
      ),
    ).toBeInTheDocument();
    expect(
      within(functionPanel).getByText(
        "The square-root length is certified by the selected positive geometric-mean trace after nonnegative sampled-radicand validation.",
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
    expect(screen.getByText("Arithmetic: mul")).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole("main"), {
      altKey: true,
      key: "ArrowUp",
    });
    expect(
      screen.getAllByText("Arithmetic: place-input").length,
    ).toBeGreaterThan(0);
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
    expect(
      within(inspector).getByText("Expression provenance"),
    ).toBeInTheDocument();
    expect(within(inspector).getByText("a * b")).toBeInTheDocument();
    expect(within(inspector).getByText("Fold assumptions")).toBeInTheDocument();
    expect(
      within(inspector).getByText(
        "This trace records the arithmetic dependency; detailed crease geometry is expanded in the rendering milestone.",
      ),
    ).toBeInTheDocument();
    expect(
      within(inspector).getByText("Selected solution"),
    ).toBeInTheDocument();
    expect(
      within(inspector).getByText("Intercept similar-triangle branch"),
    ).toBeInTheDocument();
    expect(
      within(inspector).getByText("Rejected branches"),
    ).toBeInTheDocument();
    expect(within(inspector).getAllByText("none").length).toBeGreaterThan(0);
    expect(within(inspector).getByText("Sampled value")).toBeInTheDocument();
    expect(within(inspector).getByText("6")).toBeInTheDocument();
    expect(
      within(inspector).getByText("Source provenance"),
    ).toBeInTheDocument();
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
  }, 10_000);

  it("shows square powers as certified origami function phases", () => {
    render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: "Flat origami roadmap" }),
    );
    const functionPanel = screen.getByRole("region", {
      name: "Fold-computed function",
    });
    fireEvent.change(
      within(functionPanel).getByRole("textbox", { name: "Origami function" }),
      { target: { value: "f(a)=a^2" } },
    );
    fireEvent.click(
      within(functionPanel).getByRole("button", {
        name: "Compile origami function",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Jump to function phase origami-function-phase-3",
      }),
    );
    fireEvent.click(
      within(functionPanel).getByRole("button", { name: "Show diagnostics" }),
    );

    expect(within(functionPanel).getAllByText("ready").length).toBeGreaterThan(
      1,
    );
    expect(
      within(functionPanel).getByText(
        "All function animation phases are backed by physical fold steps.",
      ),
    ).toBeInTheDocument();
    expect(
      within(functionPanel).getByText(
        "square-multiplication-specialization origami-function-node-output-2-align-fold",
      ),
    ).toBeInTheDocument();
    expect(
      within(functionPanel).getByText(
        "The square length is certified as a multiplication trace specialized to one repeated source length.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Solver work backlog" }),
    ).toBeNull();
  });

  it("switches origami function fold camera views without recompiling", () => {
    render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: "Flat origami roadmap" }),
    );

    expect(
      screen.queryByRole("group", { name: "Function fold camera" }),
    ).toBeNull();
    expect(
      screen.queryByRole("checkbox", { name: "Show onion skin folds" }),
    ).toBeNull();
    expect(
      screen.queryByRole("checkbox", { name: "Show measurement labels" }),
    ).toBeNull();
    expect(
      screen.queryByRole("checkbox", { name: "Show visual fold cues" }),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: "Show visual options" }),
    ).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(
      screen.getByRole("button", { name: "Show visual options" }),
    );
    expect(
      screen.getByRole("region", { name: "Origami function visual options" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Function fold camera" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Active fold" }));
    expect(screen.getByRole("button", { name: "Active fold" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.getByRole("img", {
        name: "Origami function animation: f(a) = sqrt(a + 1)",
      }),
    ).toHaveAttribute("data-camera-mode", "active-fold");
    expect(
      screen.getByRole("img", {
        name: "Origami function animation: f(a) = sqrt(a + 1)",
      }),
    ).toHaveAttribute("viewBox", "54 36 192 132");

    fireEvent.click(screen.getByRole("button", { name: "Whole" }));
    expect(screen.getByRole("button", { name: "Whole" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.getByRole("img", {
        name: "Origami function animation: f(a) = sqrt(a + 1)",
      }),
    ).toHaveAttribute("data-camera-mode", "whole");
    expect(
      screen.getByRole("checkbox", { name: "Show measurement labels" }),
    ).not.toBeChecked();
    expect(
      screen.getByRole("img", {
        name: "Origami function animation: f(a) = sqrt(a + 1)",
      }),
    ).toHaveAttribute("data-measurement-labels", "hidden");
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Show measurement labels" }),
    );
    expect(
      screen.getByRole("img", {
        name: "Origami function animation: f(a) = sqrt(a + 1)",
      }),
    ).toHaveAttribute("data-measurement-labels", "visible");
    expect(screen.getByText("unit = 1")).toBeInTheDocument();
    expect(screen.getByText("a=3.00")).toBeInTheDocument();
    expect(screen.getByText("final=2.000")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show diagnostics" }));
    expect(
      screen.getByText("origami-function-plan-f-a-sqrt-a-1"),
    ).toBeInTheDocument();
  });

  it("toggles origami function onion-skin fold ghosts", () => {
    const { container } = render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: "Flat origami roadmap" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Show visual options" }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Jump to function phase origami-function-phase-9",
      }),
    );

    expect(
      container.querySelector(".origami-function-onion-skin-crease"),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Show onion skin folds" }),
    );
    expect(
      container.querySelector("[data-onion-skin='previous']"),
    ).toHaveAttribute("data-onion-phase-id", "origami-function-phase-8");
    expect(container.querySelector("[data-onion-skin='next']")).toHaveAttribute(
      "data-onion-phase-id",
      "origami-function-phase-10",
    );
  });

  it("shows optional visual cues for origami function fold events", () => {
    render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: "Flat origami roadmap" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Show visual options" }),
    );
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Show visual fold cues" }),
    );

    const cueStrip = screen.getByLabelText("Function visual cues");
    expect(within(cueStrip).getByText("Ready")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Jump to function phase origami-function-phase-9",
      }),
    );
    expect(within(cueStrip).getByText("Crease snap")).toBeInTheDocument();

    fireEvent.change(
      screen.getByRole("textbox", { name: "Origami function" }),
      {
        target: { value: "f(a)=a^3" },
      },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Compile origami function" }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Jump to function phase origami-function-phase-3",
      }),
    );
    expect(within(cueStrip).getByText("Branch selected")).toBeInTheDocument();

    fireEvent.change(
      screen.getByRole("slider", { name: "Function animation progress" }),
      { target: { value: "1" } },
    );
    expect(within(cueStrip).getByText("Result extracted")).toBeInTheDocument();

    fireEvent.change(
      screen.getByRole("textbox", { name: "Origami function" }),
      {
        target: { value: "a/(b-b)" },
      },
    );
    expect(within(cueStrip).getByText("Domain warning")).toBeInTheDocument();
  });

  it("uses the origami function step minimap to jump across computation phases", () => {
    render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: "Flat origami roadmap" }),
    );

    const minimap = screen.getByLabelText("Origami function step minimap");
    expect(
      within(minimap).getAllByRole("button", {
        name: /Jump to function phase origami-function-phase-/,
      }),
    ).toHaveLength(14);
    expect(
      screen.getByRole("button", {
        name: "Jump to function phase origami-function-phase-1",
      }),
    ).toHaveAttribute("aria-current", "step");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Jump to function phase origami-function-phase-10",
      }),
    );

    expect(
      screen.getByRole("button", {
        name: "Jump to function phase origami-function-phase-10",
      }),
    ).toHaveAttribute("aria-current", "step");
    expect(screen.getByText("10 of 14")).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: "Origami function animation: f(a) = sqrt(a + 1)",
      }),
    ).toHaveAttribute("data-phase-id", "origami-function-phase-10");
  });

  it("shows a fold storyboard with operation, assumption, and branch details", () => {
    render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: "Flat origami roadmap" }),
    );

    const storyboard = screen.getByRole("region", {
      name: "Fold storyboard",
    });
    expect(
      within(storyboard).getAllByRole("button", {
        name: /Storyboard phase /,
      }),
    ).toHaveLength(14);
    expect(within(storyboard).getByText("Phase 1")).toBeInTheDocument();
    expect(within(storyboard).getByText("Place Input")).toBeInTheDocument();
    expect(
      within(storyboard).getAllByText("Fold method")[0],
    ).toBeInTheDocument();
    expect(
      within(storyboard).getByText(
        "The paper boundary is placed as the fixed computation domain.",
      ),
    ).toBeInTheDocument();

    fireEvent.click(
      within(storyboard).getByRole("button", {
        name: /Storyboard phase 9 Extract Square Root sqrt\(a \+ 1\)/,
      }),
    );
    expect(
      screen.getByRole("img", {
        name: "Origami function animation: f(a) = sqrt(a + 1)",
      }),
    ).toHaveAttribute("data-phase-id", "origami-function-phase-9");
    expect(
      screen.getByRole("img", {
        name: "Origami function animation: f(a) = sqrt(a + 1)",
      }),
    ).toHaveAttribute("data-warning-count", "1");
    const ambiguityWarnings = screen.getByLabelText(
      "Function animation ambiguity warnings",
    );
    expect(ambiguityWarnings).toHaveTextContent("Ambiguity recorded");
    expect(ambiguityWarnings).not.toHaveTextContent("Solver fallback");
    const whyThisFold = screen.getByLabelText("Why this fold?");
    expect(whyThisFold).toHaveTextContent("Align Fold: sqrt(a + 1)");
    expect(whyThisFold).toHaveTextContent(
      "The valley fold keeps sqrt(a + 1) represented as a paper length",
    );
    expect(whyThisFold).toHaveTextContent("Positive geometric-mean branch");
    expect(whyThisFold).toHaveTextContent(
      "origami-function-node-output-3 -> origami-function-node-output-4-align-fold",
    );
    expect(
      within(storyboard).getByRole("button", {
        name: /Storyboard phase 9 Extract Square Root sqrt\(a \+ 1\)/,
      }),
    ).toHaveAttribute("aria-current", "step");
    expect(
      within(storyboard).getAllByText("geometric-mean-square-root").length,
    ).toBeGreaterThan(0);
    expect(
      within(storyboard).getAllByText(
        /selected positive geometric-mean trace after nonnegative sampled-radicand validation/,
      ).length,
    ).toBeGreaterThan(0);
    expect(
      within(storyboard).getAllByText("Positive geometric-mean branch").length,
    ).toBeGreaterThan(0);

    const phaseNineCard = within(storyboard).getByRole("button", {
      name: /Storyboard phase 9 Extract Square Root sqrt\(a \+ 1\)/,
    });
    fireEvent.mouseEnter(phaseNineCard);
    expect(phaseNineCard).toHaveAttribute("data-dependency-highlight", "phase");
    expect(phaseNineCard).toHaveAttribute(
      "data-source-object-ids",
      "origami-function-node-output-3",
    );
    expect(phaseNineCard).toHaveAttribute(
      "data-output-object-ids",
      "origami-function-node-output-4-align-fold",
    );
    expect(
      screen.getByLabelText("Function dependency highlight"),
    ).toHaveTextContent("origami-function-node-output-3");
    expect(
      screen.getByRole("button", {
        name: "Jump to function phase origami-function-phase-9",
      }),
    ).toHaveAttribute("data-dependency-highlight", "phase");
    expect(
      screen.getByRole("img", {
        name: "Origami function animation: f(a) = sqrt(a + 1)",
      }),
    ).toHaveAttribute("data-highlighted-phase-id", "origami-function-phase-9");
    fireEvent.mouseLeave(phaseNineCard);
    expect(
      screen.getByLabelText("Function dependency highlight"),
    ).toHaveAttribute("data-active", "false");
  });

  it("plays a clean origami function presentation mode and restores controls", () => {
    const { container } = render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: "Flat origami roadmap" }),
    );
    fireEvent.change(
      screen.getByRole("slider", { name: "Function animation progress" }),
      { target: { value: "0.5" } },
    );
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Function reduced motion" }),
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Start presentation mode" }),
    );

    expect(
      container.querySelector(".origami-function-animation-panel"),
    ).toHaveAttribute("data-presentation-mode", "active");
    expect(
      screen.getByRole("button", { name: "Exit presentation mode" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByLabelText("Function presentation status"),
    ).toHaveTextContent("Phase 1 of 14");
    const presentationControls = screen.getByRole("region", {
      name: "Function presentation controls",
    });
    expect(
      within(presentationControls).getByRole("button", {
        name: "Previous function phase",
      }),
    ).toBeInTheDocument();
    expect(
      within(presentationControls).getByRole("button", {
        name: "Play function animation",
      }),
    ).toBeInTheDocument();
    expect(
      within(presentationControls).getByRole("button", {
        name: "Next function phase",
      }),
    ).toBeInTheDocument();
    fireEvent.click(
      within(presentationControls).getByRole("button", {
        name: "Next function phase",
      }),
    );
    expect(
      screen.getByLabelText("Function presentation status"),
    ).toHaveTextContent("Phase 2 of 14");
    expect(
      screen.getByRole("img", {
        name: "Origami function animation: f(a) = sqrt(a + 1)",
      }),
    ).toHaveAttribute("data-phase-id", "origami-function-phase-2");
    fireEvent.click(
      within(presentationControls).getByRole("button", {
        name: "Previous function phase",
      }),
    );
    expect(
      screen.getByLabelText("Function presentation status"),
    ).toHaveTextContent("Phase 1 of 14");
    fireEvent.click(
      within(presentationControls).getByRole("button", {
        name: "Play function animation",
      }),
    );
    expect(
      within(presentationControls).getByRole("button", {
        name: "Pause function animation",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: "Origami function animation: f(a) = sqrt(a + 1)",
      }),
    ).toHaveAttribute("data-phase-id", "origami-function-phase-1");
    expect(
      screen.queryByRole("textbox", { name: "Origami function" }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Export function animation JSON" }),
    ).toBeNull();
    expect(
      screen.queryByRole("group", { name: "Function fold camera" }),
    ).toBeNull();

    fireEvent.click(
      screen.getByRole("button", { name: "Exit presentation mode" }),
    );

    expect(
      container.querySelector(".origami-function-animation-panel"),
    ).toHaveAttribute("data-presentation-mode", "off");
    expect(
      screen.getByRole("textbox", { name: "Origami function" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Play function animation" }),
    ).toBeInTheDocument();
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
    fireEvent.click(
      within(functionPanel).getByRole("button", { name: "Show diagnostics" }),
    );
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

  it("keeps the consolidated origami default view focused and expandable", () => {
    const { container } = render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: "Flat origami roadmap" }),
    );

    expect(
      screen.queryByText("Do not modify the existing construction flow"),
    ).toBeNull();
    expect(screen.queryByText("Sample values")).toBeNull();
    expect(screen.queryByText("Fold solver")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Export function animation JSON" }),
    ).toBeNull();
    expect(
      screen.queryByRole("group", { name: "Function fold camera" }),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: "Show development notes" }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.getByRole("button", { name: "Show diagnostics" }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.getByRole("button", { name: "Show export and paper style" }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.getByRole("button", { name: "Show visual options" }),
    ).toHaveAttribute("aria-expanded", "false");

    const animation = screen.getByRole("img", {
      name: "Origami function animation: f(a) = sqrt(a + 1)",
    });
    expect(animation).toHaveAttribute("data-paper-shape", "square");
    expect(
      container.querySelector(".origami-function-planned-crease"),
    ).toBeInTheDocument();
    expect(
      container.querySelector(".origami-function-value-strip"),
    ).toHaveAttribute("data-readout-placement", "below-paper");

    fireEvent.click(screen.getByRole("button", { name: "Show diagnostics" }));
    expect(screen.getAllByText("ready").length).toBeGreaterThan(0);
    expect(
      screen.getByText(
        "All function animation phases are backed by physical fold steps.",
      ),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Show export and paper style" }),
    );
    expect(
      screen.getByRole("button", { name: "Export function animation JSON" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Show visual options" }),
    );
    expect(
      screen.getByRole("group", { name: "Function fold camera" }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Start presentation mode" }),
    );
    const presentationControls = screen.getByRole("region", {
      name: "Function presentation controls",
    });
    fireEvent.click(
      within(presentationControls).getByRole("button", {
        name: "Next function phase",
      }),
    );
    expect(
      screen.getByLabelText("Function presentation status"),
    ).toHaveTextContent("Phase 2 of 14");
    expect(
      screen.queryByRole("button", { name: "Export function animation JSON" }),
    ).toBeNull();
    expect(
      screen.queryByRole("group", { name: "Function fold camera" }),
    ).toBeNull();
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
    fireEvent.click(
      within(functionPanel).getByRole("button", { name: "Show diagnostics" }),
    );
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
    fireEvent.click(screen.getByRole("button", { name: "Show diagnostics" }));

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

  it("shows expression tree progress alongside the origami fold timeline", () => {
    render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: "Flat origami roadmap" }),
    );

    const progress = screen.getByRole("region", {
      name: "Expression progress",
    });
    expect(
      within(progress).getByLabelText("Function expression tree progress"),
    ).toBeInTheDocument();
    expect(within(progress).getByText("0 of 4 nodes")).toBeInTheDocument();
    expect(
      within(progress).getByRole("button", {
        name: "Jump to expression node a",
      }),
    ).toHaveAttribute("data-node-status", "pending");
    expect(
      within(progress).getByRole("button", {
        name: "Jump to expression node sqrt(a + 1)",
      }),
    ).toHaveAttribute("data-node-status", "pending");

    fireEvent.click(
      within(progress).getByRole("button", {
        name: "Jump to expression node sqrt(a + 1)",
      }),
    );

    expect(
      screen.getByRole("img", {
        name: "Origami function animation: f(a) = sqrt(a + 1)",
      }),
    ).toHaveAttribute("data-phase-id", "origami-function-phase-14");
    expect(
      within(progress).getByRole("button", {
        name: "Jump to expression node a",
      }),
    ).toHaveAttribute("data-node-status", "complete");
    expect(
      within(progress).getByRole("button", {
        name: "Jump to expression node sqrt(a + 1)",
      }),
    ).toHaveAttribute("data-node-status", "active");
    expect(within(progress).getByText("4 of 4 nodes")).toBeInTheDocument();
    const functionInspector = screen.getByRole("complementary", {
      name: "Function object inspector",
    });
    expect(
      within(functionInspector).getByText(
        "origami-function-phase-14 extract-result",
      ),
    ).toBeInTheDocument();
    expect(
      within(functionInspector).getByText("origami-function-node-4 sqrt"),
    ).toBeInTheDocument();
    expect(
      within(functionInspector).getAllByText("origami-function-node-output-4")
        .length,
    ).toBeGreaterThanOrEqual(2);
    expect(within(functionInspector).getByText("2.000")).toBeInTheDocument();
    expect(
      within(functionInspector).getByText("proven-physical"),
    ).toBeInTheDocument();
    expect(
      within(functionInspector).getByText(
        "The result is already present as a marked length and needs no additional fold.",
      ),
    ).toBeInTheDocument();
  });

  it("supports keyboard control for the origami animation timeline", () => {
    render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: "Flat origami roadmap" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Show diagnostics" }));
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
    fireEvent.click(
      within(functionPanel).getByRole("button", { name: "Show diagnostics" }),
    );
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

  it("loads curated origami function challenges with expected fold counts", () => {
    render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: "Flat origami roadmap" }),
    );
    const functionPanel = screen.getByRole("region", {
      name: "Fold-computed function",
    });
    const challenges = within(functionPanel).getByRole("region", {
      name: "Function challenges",
    });

    expect(within(challenges).getAllByText("15 expected folds")).toHaveLength(
      2,
    );
    expect(
      within(challenges).getByText("14 expected folds"),
    ).toBeInTheDocument();

    fireEvent.click(
      within(challenges).getByRole("button", {
        name: /Make 2a \+ b challenge f\(a,b\)=2\*a\+b/i,
      }),
    );
    expect(
      within(functionPanel).getByRole("textbox", { name: "Origami function" }),
    ).toHaveValue("f(a,b)=2*a+b");
    expect(within(functionPanel).getByText("5.500")).toBeInTheDocument();

    fireEvent.click(
      within(challenges).getByRole("button", {
        name: /Scaled reciprocal challenge f\(a,b\)=a\/\(b\+1\)/i,
      }),
    );
    expect(
      within(functionPanel).getByRole("textbox", { name: "Origami function" }),
    ).toHaveValue("f(a,b)=a/(b+1)");
    expect(within(functionPanel).getByText("1.000")).toBeInTheDocument();
    fireEvent.click(
      within(functionPanel).getByRole("button", {
        name: "Compile origami function",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Jump to function phase origami-function-phase-10",
      }),
    );
    fireEvent.click(
      within(functionPanel).getByRole("button", { name: "Show diagnostics" }),
    );
    expect(within(functionPanel).getAllByText("ready").length).toBeGreaterThan(
      1,
    );
    expect(
      within(functionPanel).getByText(
        "reciprocal-quotient-transfer origami-function-node-output-5-align-fold",
      ),
    ).toBeInTheDocument();
    expect(
      within(functionPanel).getByText(
        "The quotient length is certified by the selected reciprocal intercept trace with a nonzero sampled denominator.",
      ),
    ).toBeInTheDocument();
  });

  it("updates origami function paper style controls locally", () => {
    const { container } = render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: "Flat origami roadmap" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Show export and paper style" }),
    );

    fireEvent.change(
      screen.getByRole("combobox", { name: "Function paper palette" }),
      { target: { value: "coral-night" } },
    );
    expect(
      screen.getByRole("combobox", { name: "Function paper palette" }),
    ).toHaveValue("coral-night");
    expect(screen.getByLabelText("Function paper front color")).toHaveValue(
      "#ffe1d6",
    );
    expect(screen.getByLabelText("Function paper back color")).toHaveValue(
      "#1b1f3b",
    );
    const expectedPatternOptions = [
      "Solid",
      "Grid",
      "Dots",
      "Diagonal stripe",
      "Washi wave",
      "Coordinate grid",
      "High contrast",
    ];
    expect(
      within(
        screen.getByRole("combobox", { name: "Function paper front pattern" }),
      )
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(expectedPatternOptions);
    expect(
      within(
        screen.getByRole("combobox", { name: "Function paper back pattern" }),
      )
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(expectedPatternOptions);

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
    fireEvent.change(screen.getByLabelText("Function crease color"), {
      target: { value: "#ff00aa" },
    });
    fireEvent.change(screen.getByLabelText("Function highlight color"), {
      target: { value: "#00ffaa" },
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
    expect(
      screen.getByRole("combobox", { name: "Function paper palette" }),
    ).toHaveValue("custom");
    expect(screen.getByLabelText("Function paper back color")).toHaveValue(
      "#101820",
    );
    expect(
      screen.getByRole("combobox", { name: "Function paper front pattern" }),
    ).toHaveValue("washi-wave");
    expect(
      screen.getByRole("combobox", { name: "Function paper back pattern" }),
    ).toHaveValue("high-contrast");
    expect(screen.getByLabelText("Function crease color")).toHaveValue(
      "#ff00aa",
    );
    expect(screen.getByLabelText("Function highlight color")).toHaveValue(
      "#00ffaa",
    );
    expect(container.querySelector(".origami-function-paper-base")).toHaveStyle(
      {
        fill: "#ffffff",
        opacity: "0.65",
      },
    );
    expect(container.querySelector(".origami-function-hinge")).toHaveStyle({
      stroke: "#ff00aa",
    });
    fireEvent.change(
      screen.getByRole("slider", { name: "Function animation progress" }),
      { target: { value: "0.25" } },
    );
    expect(
      container.querySelector(".origami-function-active-crease"),
    ).toHaveStyle({
      stroke: "#00ffaa",
    });
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

    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);
    fireEvent.click(
      screen.getByRole("button", { name: "Random paper palette" }),
    );
    randomSpy.mockRestore();
    expect(
      screen.getByRole("combobox", { name: "Function paper palette" }),
    ).toHaveValue("mint-ink");
    expect(screen.getByLabelText("Function paper front color")).toHaveValue(
      "#dff7ea",
    );
    expect(screen.getByLabelText("Function paper back color")).toHaveValue(
      "#143642",
    );
    expect(screen.queryByRole("textbox", { name: "Expression" })).toBeNull();
  }, 10000);

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
    expect(within(functionPanel).getAllByText(/a=4, b=1.5/).length).toBe(1);
    fireEvent.click(
      within(functionPanel).getByRole("button", { name: "Show diagnostics" }),
    );
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
    await waitFor(() =>
      expect(
        within(functionPanel).getByText("Copied result label"),
      ).toBeInTheDocument(),
    );

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
    await waitFor(() =>
      expect(
        within(functionPanel).getByText("Copied sampled result"),
      ).toBeInTheDocument(),
    );

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
          "Fold solver: ready",
          "Animation: origami-function-phase-1 @ 0.00",
        ].join("\n"),
      ),
    );
    await waitFor(() =>
      expect(
        within(functionPanel).getByText("Copied function share block"),
      ).toBeInTheDocument(),
    );
  });

  it("imports and replays saved origami function animation JSON", async () => {
    const preview = compileOrigamiFunctionPreview("f(a,b)=a*b", {
      a: 4,
      b: 1.5,
    });
    if (preview.status !== "compiled") throw new Error("Expected compiled");
    const styled = setOrigamiFunctionPreviewPaperStyle(preview, {
      frontColor: "#ffffff",
      backColor: "#101820",
      backPattern: "high-contrast",
      patternScale: 1.75,
    });
    const replayPhase = setOrigamiFunctionPreviewPhase(
      styled,
      "origami-function-phase-4",
    );
    const json = origamiFunctionAnimationJson(replayPhase);

    render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: "Flat origami roadmap" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Show export and paper style" }),
    );
    const input = screen.getByLabelText("Import function animation JSON");
    fireEvent.change(input, {
      target: {
        files: [
          new File([json], "origami-function-animation.json", {
            type: "application/json",
          }),
        ],
      },
    });

    const functionPanel = screen.getByRole("region", {
      name: "Fold-computed function",
    });
    await waitFor(() =>
      expect(
        within(functionPanel).getByText("Imported origami-function-phase-4"),
      ).toBeInTheDocument(),
    );
    expect(
      within(functionPanel).getByRole("textbox", { name: "Origami function" }),
    ).toHaveValue("f(a, b) = a * b");
    expect(
      screen.getByRole("img", {
        name: "Origami function animation: f(a, b) = a * b",
      }),
    ).toHaveAttribute("data-phase-id", "origami-function-phase-4");
    expect(
      (
        within(functionPanel).getByRole("textbox", {
          name: "Origami function share block",
        }) as HTMLTextAreaElement
      ).value,
    ).toContain("Samples: a=4, b=1.5");
    expect(
      (
        within(functionPanel).getByRole("textbox", {
          name: "Origami function share block",
        }) as HTMLTextAreaElement
      ).value,
    ).toContain("Fold solver: ready");
    fireEvent.click(
      within(functionPanel).getByRole("button", { name: "Show diagnostics" }),
    );
    expect(
      within(functionPanel).getByText(
        "intercept-product-transfer origami-function-node-output-3-align-fold",
      ),
    ).toBeInTheDocument();
    expect(
      within(functionPanel).getByText(
        "The product length is certified by the selected intercept-style multiplication trace.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Function paper front color")).toHaveValue(
      "#ffffff",
    );
    expect(
      screen.getByRole("img", {
        name: "Origami function animation: f(a, b) = a * b",
      }),
    ).toHaveAttribute("data-phase-id", "origami-function-phase-4");
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
    fireEvent.click(screen.getByRole("button", { name: "Show diagnostics" }));
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
    expect(
      within(multiplyStep).getByText("Arithmetic: mul"),
    ).toBeInTheDocument();
    expect(within(multiplyStep).getByText("Axiom")).toBeInTheDocument();
    expect(within(multiplyStep).getByText("Macro trace")).toBeInTheDocument();
    expect(within(multiplyStep).getByText("Branch")).toBeInTheDocument();
    expect(
      within(multiplyStep).getByText("Intercept similar-triangle branch"),
    ).toBeInTheDocument();
    expect(within(multiplyStep).getByText("Proof")).toBeInTheDocument();
    expect(within(multiplyStep).getByText("Linked proof")).toBeInTheDocument();
    expect(within(multiplyStep).getByText("Degeneracy")).toBeInTheDocument();
    expect(
      within(multiplyStep).getByText("No degeneracy notes"),
    ).toBeInTheDocument();
    expect(
      within(multiplyStep).getByLabelText("Trace a * b metadata"),
    ).toHaveClass("origami-step-metadata");
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
    fireEvent.keyDown(screen.getByRole("main"), {
      altKey: true,
      key: "ArrowUp",
    });
    expect(
      screen
        .getByRole("button", {
          name: /Trace a \* b Use an intercept-style fold trace/i,
        })
        .closest("li"),
    ).not.toHaveClass("active");

    fireEvent.click(claim);
    expect(claim).toHaveAttribute("aria-pressed", "true");
    expect(
      screen
        .getByRole("button", {
          name: /Trace a \* b Use an intercept-style fold trace/i,
        })
        .closest("li"),
    ).toHaveClass("active");
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
