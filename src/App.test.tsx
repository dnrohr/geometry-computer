import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders the Geometry Computer heading", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Geometry Computer" }),
    ).toBeInTheDocument();
  });
});
