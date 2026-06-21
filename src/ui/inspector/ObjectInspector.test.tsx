import { fireEvent, render, screen } from "@testing-library/react";
import { segmentObject } from "../../domain/geometry/types";
import { ObjectInspector } from "./ObjectInspector";

const object = segmentObject(
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  {
    id: "result",
    label: "r",
    role: "result",
    createdByStepId: "step-2",
    usedByStepIds: ["step-3"],
    dependsOnObjectIds: ["a", "b"],
    represents: "a + b",
  },
);

describe("ObjectInspector UI-100–103", () => {
  it("renders the polite empty state", () => {
    render(<ObjectInspector />);
    expect(screen.getByText(/select an object/i)).toBeInTheDocument();
    expect(
      screen.getByText(/select an object/i).closest("section"),
    ).toHaveAttribute("aria-live", "polite");
  });

  it("renders all provenance fields and closes", () => {
    const onClose = vi.fn();
    render(<ObjectInspector object={object} onClose={onClose} />);
    ["r", "segment · result", "step-2", "a, b", "step-3", "a + b"].forEach(
      (text) => expect(screen.getByText(text)).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Close inspector" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("uses readable relationship fallbacks", () => {
    render(
      <ObjectInspector
        object={{
          ...object,
          label: undefined,
          represents: undefined,
          dependsOnObjectIds: [],
          usedByStepIds: [],
        }}
      />,
    );
    expect(screen.getByText("result")).toBeInTheDocument();
    expect(screen.getByText("None")).toBeInTheDocument();
    expect(screen.getByText("None yet")).toBeInTheDocument();
  });
});
