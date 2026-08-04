import { fireEvent, render, screen } from "@testing-library/react";
import App from "./App";

describe("workspace tabs", () => {
  it("preserves origami selection and time across tab switches", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("tab", { name: "Origami folding" }));
    const example = screen.getByRole("button", { name: /Corner to corner/ });
    fireEvent.click(example);
    fireEvent.click(screen.getByRole("button", { name: "Next action" }));
    const timeline = screen.getByRole("slider", { name: "Timeline" });
    const savedTime = (timeline as HTMLInputElement).value;
    fireEvent.click(screen.getByRole("tab", { name: "Euclidean construction" }));
    fireEvent.click(screen.getByRole("tab", { name: "Origami folding" }));
    expect(screen.getByRole("button", { name: /Corner to corner/ })).toHaveClass("active");
    expect(screen.getByRole("slider", { name: "Timeline" })).toHaveValue(savedTime);
  }, 20000);

  it("supports the tablist keyboard pattern", () => {
    render(<App />);
    const euclidean = screen.getByRole("tab", { name: "Euclidean construction" });
    fireEvent.keyDown(euclidean, { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Origami folding" })).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(screen.getByRole("tab", { name: "Origami folding" }), { key: "Home" });
    expect(euclidean).toHaveAttribute("aria-selected", "true");
  }, 20000);
});
