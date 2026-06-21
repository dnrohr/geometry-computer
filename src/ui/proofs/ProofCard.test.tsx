import { fireEvent, render, screen } from "@testing-library/react";
import { arithmeticProofs } from "../../domain/proofs/arithmeticProofs";
import { ProofCard } from "./ProofCard";

describe("ProofCard", () => {
  it("supports persistent click/tap proof highlighting", () => {
    const highlights = vi.fn();
    render(<ProofCard proof={arithmeticProofs.mul} onHighlight={highlights} />);
    const claim = screen.getByRole("button");
    fireEvent.click(claim);
    expect(claim).toHaveAttribute("aria-pressed", "true");
    expect(highlights).toHaveBeenLastCalledWith(
      arithmeticProofs.mul.claims[0].highlightObjectIds,
    );
  });

  it("renders all proof sections and optional assumptions", () => {
    render(<ProofCard proof={arithmeticProofs.div} />);
    expect(
      screen.getByRole("article", { name: /division proof/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(arithmeticProofs.div.intuition),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Given" })).toBeInTheDocument();
    expect(screen.getByText(/y ≠ 0/)).toBeInTheDocument();
    expect(
      screen.getByText(arithmeticProofs.div.conclusion),
    ).toBeInTheDocument();
  });

  it("highlights claims on hover/focus and clears transient state", () => {
    const highlights = vi.fn();
    render(<ProofCard proof={arithmeticProofs.mul} onHighlight={highlights} />);
    const claim = screen.getByRole("button");
    fireEvent.mouseEnter(claim);
    fireEvent.mouseLeave(claim);
    fireEvent.focus(claim);
    fireEvent.blur(claim);
    expect(highlights).toHaveBeenNthCalledWith(
      1,
      arithmeticProofs.mul.claims[0].highlightObjectIds,
    );
    expect(highlights).toHaveBeenLastCalledWith([]);
  });

  it("toggles selected claims and closes", () => {
    const highlights = vi.fn();
    const onClose = vi.fn();
    render(
      <ProofCard
        proof={arithmeticProofs.mul}
        onHighlight={highlights}
        onClose={onClose}
      />,
    );
    const claim = screen.getByRole("button", {
      name: /parallel lines make/i,
    });
    fireEvent.click(claim);
    expect(claim).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(claim);
    expect(claim).toHaveAttribute("aria-pressed", "false");
    expect(highlights).toHaveBeenLastCalledWith([]);
    fireEvent.click(screen.getByRole("button", { name: "Close proof" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
