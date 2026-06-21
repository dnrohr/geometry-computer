import { fireEvent, render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders the compiled polynomial construction and controls", () => {
    const { container } = render(<App />);
    expect(
      screen.getByRole("heading", { name: "Geometry Computer" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("3a² + 4ab + b²").length).toBeGreaterThan(0);
    expect(screen.getAllByText("(3a + b)(a + b)").length).toBeGreaterThan(0);
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
  });
});
