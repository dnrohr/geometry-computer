import { fireEvent, render, screen } from "@testing-library/react";
import { ExpressionInput } from "./ExpressionInput";

describe("ExpressionInput UI-020–023", () => {
  const base = {
    expression: "a+b",
    values: { a: 2, b: 3, x: 4, y: 5 },
    onExpression: vi.fn(),
    onValues: vi.fn(),
    onCompile: vi.fn(),
  };

  it("edits the expression draft and submits by button or Enter", () => {
    const props = { ...base, onExpression: vi.fn(), onCompile: vi.fn() };
    render(<ExpressionInput {...props} />);
    const expression = screen.getByRole("textbox", { name: "Expression" });
    fireEvent.change(expression, { target: { value: "sqrt(a)" } });
    expect(props.onExpression).toHaveBeenCalledWith("sqrt(a)");
    fireEvent.click(
      screen.getByRole("button", { name: "Compile construction" }),
    );
    fireEvent.submit(expression.closest("form")!);
    expect(props.onCompile).toHaveBeenCalledTimes(2);
  });

  it("updates one numeric sample without losing the others", () => {
    const onValues = vi.fn();
    render(<ExpressionInput {...base} onValues={onValues} />);
    const a = screen.getByRole("spinbutton", { name: "a" });
    expect(a).toHaveAttribute("step", "any");
    fireEvent.change(a, { target: { value: "7.5" } });
    expect(onValues).toHaveBeenCalledWith({ a: 7.5, b: 3, x: 4, y: 5 });
    expect(screen.getAllByRole("spinbutton")).toHaveLength(4);
  });

  it("associates a readable alert with the expression field", () => {
    render(<ExpressionInput {...base} error="Division by zero." />);
    expect(screen.getByRole("alert")).toHaveTextContent("Division by zero.");
    expect(screen.getByRole("textbox", { name: "Expression" })).toHaveAttribute(
      "aria-describedby",
      "expression-error",
    );
  });
});
