import { fireEvent, render, screen } from "@testing-library/react";
import { OrigamiWorkspace } from "./OrigamiWorkspace";

describe("OrigamiWorkspace authoring history", () => {
  it("computes, undoes, and redoes a guided fold", () => {
    render(<OrigamiWorkspace />);
    fireEvent.click(screen.getByRole("button", { name: "Compute fold" }));
    expect(screen.getByRole("heading", { name: "My guided fold" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.getByRole("heading", { name: "Edge bisection" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Redo" }));
    expect(screen.getByRole("heading", { name: "My guided fold" })).toBeInTheDocument();
  }, 10000);

  it("retains the last valid construction after an invalid request", () => {
    render(<OrigamiWorkspace />);
    fireEvent.change(screen.getByLabelText("Target X"), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Compute fold" }));
    expect(screen.getByRole("alert")).toHaveTextContent("last valid construction is unchanged");
    expect(screen.getByRole("heading", { name: "Edge bisection" })).toBeInTheDocument();
  });

  it("loads and navigates the three-fold reference session", () => {
    render(<OrigamiWorkspace />);
    fireEvent.click(screen.getByRole("button", { name: "Load three-fold reference" }));
    expect(screen.getByRole("heading", { name: "Fold left to right" })).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Session timeline" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next fold" }));
    expect(screen.getByRole("heading", { name: "Fold across the center" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save session JSON" })).toBeEnabled();
    expect(screen.getAllByTestId("session-crease")).toHaveLength(3);
  }, 10000);

  it("reports malformed session input without discarding the current view", () => {
    render(<OrigamiWorkspace />);
    fireEvent.click(screen.getByText("Load saved session"));
    fireEvent.change(screen.getByLabelText("Saved session JSON"), { target: { value: "{}" } });
    fireEvent.click(screen.getByRole("button", { name: "Load session JSON" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/malformed origami session/i);
    expect(screen.getByRole("heading", { name: "Edge bisection" })).toBeInTheDocument();
  });

  it("preserves timeline state while switching between 2D and 3D", () => {
    render(<OrigamiWorkspace />);
    fireEvent.click(screen.getByRole("button", { name: "Next action" }));
    const saved = (screen.getByRole("slider", { name: "Timeline" }) as HTMLInputElement).value;
    fireEvent.click(screen.getByRole("button", { name: "Interactive 3D" }));
    expect(screen.getByRole("status")).toHaveTextContent("3D preview unavailable");
    fireEvent.click(screen.getByRole("button", { name: "Precise 2D" }));
    expect(screen.getByRole("slider", { name: "Timeline" })).toHaveValue(saved);
  });

  it("uses discrete meaningful steps when reduced motion is requested", () => {
    const previous = window.matchMedia;
    window.matchMedia = (() => ({ matches: true })) as unknown as typeof window.matchMedia;
    try {
      render(<OrigamiWorkspace />);
      const timeline = screen.getByRole("slider", { name: "Timeline" }) as HTMLInputElement;
      expect(timeline.value).toBe("0");
      fireEvent.click(screen.getByRole("button", { name: "Play" }));
      expect(Number(timeline.value)).toBeGreaterThan(0);
      expect(screen.queryByRole("button", { name: "Pause" })).not.toBeInTheDocument();
    } finally { window.matchMedia = previous; }
  });
});
