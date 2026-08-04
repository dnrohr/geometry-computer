import { compileOrigamiExample, origamiExamples } from "./examples";
import { activeTracePhase, buildOrigamiTrace } from "./trace";

describe("origami trace", () => {
  it("builds ordered domain-backed phases", () => {
    const example = origamiExamples[0];
    const document = compileOrigamiExample(example);
    const phases = buildOrigamiTrace(example, document);
    expect(phases.map(({ time }) => time)).toEqual([...phases.map(({ time }) => time)].sort((a, b) => a - b));
    expect(phases.find(({ id }) => id === "fold")?.summary).toContain(example.movingSide);
    expect(phases.at(-1)?.time).toBe(document.metadata.duration);
  });

  it("selects the active phase from timeline time", () => {
    const example = origamiExamples[3];
    const phases = buildOrigamiTrace(example, compileOrigamiExample(example));
    expect(activeTracePhase(phases, phases.find(({ id }) => id === "unfold")!.time).id).toBe("unfold");
  });
});
