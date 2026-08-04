import { readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  exportConstruction,
  parseArguments,
  parseValues,
} from "./exportConstruction";

describe("construction export CLI", () => {
  it("parses named numeric values", () => {
    expect(parseValues("a=3, b=-2.5")).toEqual({ a: 3, b: -2.5 });
  });

  it("rejects malformed assignments", () => {
    expect(() => parseValues("a:nope")).toThrow("name=number");
  });

  it("uses a deterministic default output", () => {
    expect(
      parseArguments(["--expression", "a+b", "--values", "a=1,b=2"]),
    ).toMatchObject({
      expression: "a+b",
      values: { a: 1, b: 2 },
      output: "media/constructions/construction.json",
    });
  });

  it("exports identical geometry and timing for identical input", async () => {
    const directory = join(tmpdir(), `geometry-computer-${process.pid}`);
    const first = join(directory, "first.json");
    const second = join(directory, "second.json");
    try {
      const options = { expression: "a+b", values: { a: 3, b: 2 } };
      await exportConstruction({ ...options, output: first });
      await exportConstruction({ ...options, output: second });
      expect(await readFile(first, "utf8")).toBe(
        await readFile(second, "utf8"),
      );
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
