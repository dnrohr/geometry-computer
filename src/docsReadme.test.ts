import { readFileSync } from "node:fs";

describe("README product documentation", () => {
  it("describes the current flat-origami function lab workflow", () => {
    const readme = readFileSync("README.md", "utf8");

    expect(readme).toContain("fold-computed function lab");
    expect(readme).toContain("f(a)=sqrt(a+1)");
    expect(readme).toContain("square two-sided paper fold sequence");
    expect(readme).toMatch(/expression\s+progress/);
    expect(readme).toContain("function object inspector");
    expect(readme).toMatch(/saved\s+animation JSON can be imported for replay/);
  });
});
