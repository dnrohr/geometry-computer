import { fireEvent, render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("turns a constructible expression into a computed plan", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Geometry Computer" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Take the square root of 5").closest("li"),
    ).toHaveTextContent("L1Take the square root of 5");
    expect(screen.getByText("Divide L2 and 2").closest("li")).toHaveTextContent(
      "L3Divide L2 and 2",
    );
  });

  it("reports invalid input without generating stale steps", () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText(/use numbers/i), {
      target: { value: "sqrt(-1)" },
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Expected a number, sqrt, or '('",
    );
    expect(
      screen.getByText("Correct the expression to generate a plan."),
    ).toBeInTheDocument();
  });
});
