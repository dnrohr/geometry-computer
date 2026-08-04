import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { OrigamiTracePanel } from "./OrigamiTracePanel";

const phases = [{ id: "prepare", time: 0, title: "Prepare", summary: "Start flat.", instruction: "Lay down the sheet.", objectIds: ["paper"] }, { id: "fold", time: 1, title: "Fold", summary: "Move the face.", instruction: "Match the points.", objectIds: ["face"] }];

describe("OrigamiTracePanel", () => {
  it("navigates to and highlights trace phases", () => {
    const onSelect = vi.fn(); const onHover = vi.fn();
    render(<OrigamiTracePanel phases={phases} activeId="prepare" onSelect={onSelect} onHover={onHover} />);
    const fold = screen.getByRole("button", { name: /Fold/ });
    fireEvent.mouseEnter(fold.closest("li")!);
    fireEvent.click(fold);
    expect(onHover).toHaveBeenCalledWith(phases[1]);
    expect(onSelect).toHaveBeenCalledWith(phases[1]);
    expect(screen.getByRole("button", { name: /Prepare/ })).toHaveAttribute("aria-current", "step");
  });
});
