import { fireEvent, render, screen } from "@testing-library/react";
import { add, mul, variable } from "../../domain/expression/types";
import { ExpressionTree } from "./ExpressionTree";

describe("ExpressionTree UI-090–093", () => {
  const expression = mul(add(variable("a"), variable("b")), variable("a"));

  it("renders recursive nodes and equality context", () => {
    const { container } = render(
      <ExpressionTree
        expression={expression}
        originalExpression="a² + ab"
        simplifiedExpression="(a + b) * a"
      />,
    );
    expect(screen.getByText("a² + ab")).toBeInTheDocument();
    expect(screen.getByText(/→ \(a \+ b\) \* a/)).toBeInTheDocument();
    expect(container.querySelectorAll(".expression-tree button")).toHaveLength(
      5,
    );
  });

  it("marks the represented active node and reports activation", () => {
    const onSelect = vi.fn();
    const { container } = render(
      <ExpressionTree
        expression={expression}
        activeExpression="a + b"
        onSelect={onSelect}
      />,
    );
    const active = container.querySelector("li.active > button");
    expect(active).toHaveTextContent("a + b");
    fireEvent.click(screen.getByRole("button", { name: "a + b" }));
    expect(onSelect).toHaveBeenCalledWith("a + b");
  });

  it("omits a redundant equivalence arrow", () => {
    render(
      <ExpressionTree
        expression={variable("a")}
        originalExpression="a"
        simplifiedExpression="a"
      />,
    );
    expect(screen.queryByText(/→/)).not.toBeInTheDocument();
  });
});
