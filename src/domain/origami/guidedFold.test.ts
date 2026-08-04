import { compileGuidedFold, type GuidedFoldRequest } from "./guidedFold";

const requests: GuidedFoldRequest[] = [
  { operation: "point-to-point", title: "P2P", movingSide: "left", source: { x: 2, y: 3 }, target: { x: 8, y: 3 } },
  { operation: "line-to-line", title: "L2L", movingSide: "left", sourceAngle: 0, targetAngle: 90, branch: "internal" },
  { operation: "parallel", title: "Parallel", movingSide: "right", sourceY: 1, targetY: 5 },
  { operation: "through-point", title: "Through", movingSide: "left", through: { x: 5, y: 3 }, angle: 90 },
  { operation: "point-to-line-through-point", title: "O5", movingSide: "left", source: { x: 2, y: 3 }, targetX: 8, through: { x: 5, y: 3 }, candidate: 0 },
];

describe("guided origami folds", () => {
  it.each(requests)("compiles $operation into the canonical render document", (request) => {
    const result = compileGuidedFold(request);
    expect(result.document.version).toBe(2);
    expect(result.document.revealActions.some(({ animation }) => animation === "fold")).toBe(true);
    expect(result.example.operation).not.toBe("");
  });

  it("requires an available real candidate", () => {
    expect(() => compileGuidedFold({ ...requests[4], candidate: 1 } as GuidedFoldRequest)).toThrow(/candidate/i);
  });
});
