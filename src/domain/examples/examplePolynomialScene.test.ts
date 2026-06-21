import { examplePolynomialScene } from "./examplePolynomialScene";

describe("example polynomial scene", () => {
  it("is compiler-generated with similar-triangle scaffolding", () => {
    expect(
      [...examplePolynomialScene.steps]
        .reverse()
        .find(({ level }) => level === "macro")?.operation,
    ).toBe("mul");
    expect(
      examplePolynomialScene.objects.some(
        ({ represents }) => represents === "main ray",
      ),
    ).toBe(true);
    expect(examplePolynomialScene.value).toBe(21);
  });
  it("uses stable scene IDs without duplicates", () => {
    const ids = examplePolynomialScene.objects.map(({ id }) => id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
