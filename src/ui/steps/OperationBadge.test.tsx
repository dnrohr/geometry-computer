import { fireEvent, render, screen } from "@testing-library/react";
import type {
  ConstructionOpKind,
  ConstructionStep,
} from "../../domain/construction/types";
import { OperationBadge } from "./OperationBadge";

const step = (
  operation?: ConstructionOpKind,
  proofId?: string,
): ConstructionStep => ({
  id: "step",
  level: "macro",
  title: "Construct r",
  summary: "summary",
  operation,
  inputObjectIds: operation === "given" ? [] : ["x", "y"],
  outputObjectIds: ["r"],
  createdObjectIds: ["r"],
  proofId,
});

describe("OperationBadge UI-085–086", () => {
  it.each([
    ["given", "given length"],
    ["constant", "unit transfer"],
    ["add", "segment transfer"],
    ["sub", "directed transfer"],
    ["mul", "similar-triangle scaling"],
    ["div", "inverse scaling"],
    ["square", "self-scaling"],
    ["sqrt", "geometric mean"],
  ] as const)("describes %s", (operation, method) => {
    const { container, unmount } = render(
      <OperationBadge step={step(operation)} />,
    );
    expect(screen.getByText(operation)).toBeInTheDocument();
    expect(screen.getByText(method)).toBeInTheDocument();
    expect(container.querySelector("span")).toHaveTextContent(
      operation === "given" ? "given → r" : "x + y → r",
    );
    unmount();
  });

  it("renders nothing for primitive steps", () => {
    const { container } = render(<OperationBadge step={step()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows and activates Why only for proof-linked macros", () => {
    const onProof = vi.fn();
    const { rerender } = render(
      <OperationBadge step={step("mul", "proof-mul")} onProof={onProof} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Why?" }));
    expect(onProof).toHaveBeenCalledOnce();
    rerender(<OperationBadge step={step("given")} onProof={onProof} />);
    expect(
      screen.queryByRole("button", { name: "Why?" }),
    ).not.toBeInTheDocument();
  });
});
