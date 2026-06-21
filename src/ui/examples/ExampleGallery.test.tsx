import { fireEvent, render, screen } from "@testing-library/react";
import { gallery } from "../../domain/examples/gallery";
import { ExampleGallery } from "./ExampleGallery";

describe("ExampleGallery UI-030–031", () => {
  it("renders every named example with expression and note", () => {
    render(<ExampleGallery examples={gallery} onSelect={vi.fn()} />);
    expect(screen.getAllByRole("button")).toHaveLength(8);
    gallery.forEach((example) => {
      expect(screen.getByText(example.name)).toBeInTheDocument();
      expect(screen.getByText(example.note)).toBeInTheDocument();
    });
  });

  it.each(gallery)("returns the complete $name example", (example) => {
    const onSelect = vi.fn();
    render(<ExampleGallery examples={gallery} onSelect={onSelect} />);
    fireEvent.click(
      screen.getByRole("button", {
        name: `${example.name}: ${example.expression}. ${example.note}`,
      }),
    );
    expect(onSelect).toHaveBeenCalledWith(example);
  });
});
