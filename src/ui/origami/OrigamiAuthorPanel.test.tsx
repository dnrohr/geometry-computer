import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { OrigamiAuthorPanel } from "./OrigamiAuthorPanel";

describe("OrigamiAuthorPanel", () => {
  it("creates the selected operation without JSON editing", () => {
    const onCompile = vi.fn();
    render(<OrigamiAuthorPanel onCompile={onCompile} onUndo={vi.fn()} onRedo={vi.fn()} onReset={vi.fn()} canUndo={false} canRedo={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Compute fold" }));
    expect(onCompile).toHaveBeenCalledWith(expect.objectContaining({ operation: "point-to-point", movingSide: "left" }));
  });

  it("exposes branch selection and recoverable errors", () => {
    render(<OrigamiAuthorPanel onCompile={vi.fn()} onUndo={vi.fn()} onRedo={vi.fn()} onReset={vi.fn()} canUndo canRedo error="Coincident points do not determine one crease." />);
    fireEvent.change(screen.getByLabelText("Fold operation"), { target: { value: "line-to-line" } });
    expect(screen.getByLabelText("Angle-bisector branch")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("last valid construction is unchanged");
    expect(screen.getByRole("button", { name: "Undo" })).toBeEnabled();
  });
});
