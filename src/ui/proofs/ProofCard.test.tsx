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
});
