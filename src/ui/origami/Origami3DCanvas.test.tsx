import { render, screen } from "@testing-library/react";
import {
  compileOrigamiExample,
  origamiExamples,
} from "../../domain/origami/examples";
import { Origami3DCanvas } from "./Origami3DCanvas";

describe("Origami3DCanvas", () => {
  it("offers an understandable exact-2D fallback without WebGL", () => {
    render(
      <Origami3DCanvas
        document={compileOrigamiExample(origamiExamples[0])}
        time={0}
        forceUnavailable
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "3D preview unavailable",
    );
    expect(screen.getByRole("status")).toHaveTextContent("exact 2D fold view");
  });
});
