import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { constructionExport } from "../../domain/export/exportConstruction";
import { compileExpression } from "../../domain/compiler/compileExpression";
import { parseExpression } from "../../domain/parser/parseExpression";
import { ManimExportPanel } from "./ManimExportPanel";

const document = constructionExport(
  compileExpression(parseExpression("a+b"), { a: 3, b: 2 }),
);
const response = (body: object, ok = true) =>
  Promise.resolve({ ok, json: () => Promise.resolve(body) } as Response);

describe("Manim video export", () => {
  afterEach(() => vi.restoreAllMocks());

  it("offers quality choices without disrupting other exports", () => {
    render(<ManimExportPanel document={document} />);
    expect(
      screen.getByRole("heading", { name: "Render an MP4" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Quality" })).toHaveValue(
      "standard",
    );
    expect(
      screen.queryByRole("combobox", { name: "Fold style" }),
    ).not.toBeInTheDocument();
  });

  it("reports an unavailable service as an isolated error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    render(<ManimExportPanel document={document} />);
    fireEvent.click(screen.getByRole("button", { name: "Render MP4" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /construction is unchanged.*JSON or SVG export still works/i,
    );
  });

  it("shows the exact path and download when rendering completes", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      response({
        id: "job-1",
        status: "complete",
        phase: "complete",
        outputPath: "C:\\renders\\result.mp4",
        videoUrl: "/jobs/job-1/video",
      }),
    );
    render(<ManimExportPanel document={document} />);
    fireEvent.click(screen.getByRole("button", { name: "Render MP4" }));
    expect(
      await screen.findByRole("link", { name: "Download MP4" }),
    ).toHaveAttribute("href", "http://127.0.0.1:8765/jobs/job-1/video");
    expect(screen.getByText(/C:\\renders\\result.mp4/)).toBeInTheDocument();
  });

  it("cancels an active render", async () => {
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockImplementationOnce(() =>
        response({
          id: "job-1",
          status: "running",
          phase: "rendering-and-encoding",
        }),
      )
      .mockImplementationOnce(() =>
        response({ id: "job-1", status: "cancelled", phase: "cancelled" }),
      );
    render(<ManimExportPanel document={document} />);
    fireEvent.click(screen.getByRole("button", { name: "Render MP4" }));
    fireEvent.click(await screen.findByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("Render cancelled")).toBeInTheDocument();
  });
});
