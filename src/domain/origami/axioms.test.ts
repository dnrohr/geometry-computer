import {
  solveAxiom,
  solveO1,
  solveO2,
  solveO3,
  solveO4,
  solveO5,
  solveO6,
  solveO7,
  type AxiomSolution,
} from "./axioms";
import { lineThrough } from "./geometry";

const expectCertified = (solution: AxiomSolution) => {
  expect(solution.candidates.length).toBeGreaterThan(0);
  solution.candidates.forEach(({ maxResidual }) =>
    expect(maxResidual).toBeLessThan(1e-7),
  );
};

describe("Huzita-Hatori O1-O7", () => {
  it("O1 folds through two points and rejects coincidence", () => {
    expectCertified(solveO1({ x: 1, y: 2 }, { x: 4, y: 5 }));
    expect(() => solveO1({ x: 1, y: 2 }, { x: 1, y: 2 })).toThrow(
      /O1 requires two distinct/i,
    );
  });

  it("O2 places one point onto another", () => {
    expectCertified(solveO2({ x: 0, y: 2 }, { x: 8, y: 2 }));
    expect(() => solveO2({ x: 1, y: 1 }, { x: 1, y: 1 })).toThrow(
      /do not determine/i,
    );
  });

  it("O3 returns both intersecting branches and one parallel branch", () => {
    const horizontal = lineThrough({ x: 0, y: 0 }, { x: 1, y: 0 });
    const vertical = lineThrough({ x: 0, y: 0 }, { x: 0, y: 1 });
    const intersecting = solveO3(horizontal, vertical);
    expectCertified(intersecting);
    expect(intersecting.candidates).toHaveLength(2);
    const parallel = solveO3(
      horizontal,
      lineThrough({ x: 0, y: 4 }, { x: 1, y: 0 }),
    );
    expectCertified(parallel);
    expect(parallel.candidates).toHaveLength(1);
    expect(() => solveO3(horizontal, horizontal)).toThrow(
      /no uniquely determined/i,
    );
  });

  it("O4 creates the unique perpendicular crease through a point", () => {
    expectCertified(
      solveO4({ x: 2, y: 3 }, lineThrough({ x: 0, y: 0 }, { x: 1, y: 0 })),
    );
  });

  it("O5 returns two real branches and reports no-real constraints", () => {
    const solution = solveO5(
      { x: 0, y: 0 },
      lineThrough({ x: -5, y: 3 }, { x: 1, y: 0 }),
      { x: 4, y: 0 },
    );
    expectCertified(solution);
    expect(solution.candidates).toHaveLength(2);
    expect(() =>
      solveO5({ x: 0, y: 0 }, lineThrough({ x: 0, y: 10 }, { x: 1, y: 0 }), {
        x: 1,
        y: 0,
      }),
    ).toThrow(/No real crease/i);
  });

  const o6Base = {
    firstPoint: { x: 2.008557452856551, y: 3.451467752661992 },
    secondPoint: { x: 7.298895318789723, y: 3.5250777992087174 },
    firstTarget: {
      point: { x: 4.54391850321152, y: 5.825234539603149 },
      direction: { x: -0.7933682067208574, y: 0.6087420542105915 },
    },
  };

  it("O6 produces one, two, or three certified cubic branches", () => {
    const one = solveO6(
      { x: 3.571654907837532, y: 3.6508866231742343 },
      {
        point: { x: 6.375463459084392, y: 2.16926214841588 },
        direction: { x: -0.10793336120681361, y: -0.9941581310529023 },
      },
      { x: 4.545332471170676, y: 3.795606334112788 },
      {
        point: { x: 6.060623938385646, y: 4.40757256288576 },
        direction: { x: -0.6936864865038225, y: -0.7202770706068478 },
      },
    );
    const two = solveO6(
      o6Base.firstPoint,
      o6Base.firstTarget,
      o6Base.secondPoint,
      {
        point: { x: 0.02920806334875814, y: 2.8611575541627206 },
        direction: { x: 0.7502309693346167, y: -0.6611758409464469 },
      },
    );
    const three = solveO6(
      o6Base.firstPoint,
      o6Base.firstTarget,
      o6Base.secondPoint,
      {
        point: { x: 1.5985116859697168, y: 4.641833896319947 },
        direction: { x: 0.7502309693346167, y: -0.6611758409464469 },
      },
    );
    [one, two, three].forEach(expectCertified);
    expect([
      one.candidates.length,
      two.candidates.length,
      three.candidates.length,
    ]).toEqual([1, 2, 3]);
  });

  it("O6 reports a no-real parallel constraint", () => {
    expect(() =>
      solveO6(
        { x: 8.371752751533919, y: 1.5532242102559755 },
        lineThrough({ x: 0, y: 5.007036575949725 }, { x: 1, y: 0 }),
        { x: 8.319123093610397, y: 3.048929272226861 },
        lineThrough({ x: 0, y: 2.9638897155163546 }, { x: 1, y: 0 }),
      ),
    ).toThrow(/no real nondegenerate/i);
  });

  it("O7 satisfies point-on-line and perpendicular constraints", () => {
    expectCertified(
      solveO7(
        { x: 0, y: 2 },
        lineThrough({ x: 0, y: 0 }, { x: 1, y: 0 }),
        lineThrough({ x: 0, y: 0 }, { x: 0, y: 1 }),
      ),
    );
    expect(() =>
      solveO7(
        { x: 0, y: 2 },
        lineThrough({ x: 0, y: 0 }, { x: 1, y: 0 }),
        lineThrough({ x: 0, y: 0 }, { x: 1, y: 0 }),
      ),
    ).toThrow(/no unique crease/i);
  });

  it("orders candidates deterministically", () => {
    const args = [
      o6Base.firstPoint,
      o6Base.firstTarget,
      o6Base.secondPoint,
      {
        point: { x: 1.5985116859697168, y: 4.641833896319947 },
        direction: { x: 0.7502309693346167, y: -0.6611758409464469 },
      },
    ] as const;
    expect(solveO6(...args).candidates.map(({ crease }) => crease)).toEqual(
      solveO6(...args).candidates.map(({ crease }) => crease),
    );
  });

  it("dispatches typed axiom requests", () => {
    expect(
      solveAxiom({
        axiom: "O2",
        source: { x: 0, y: 0 },
        target: { x: 2, y: 0 },
      }).axiom,
    ).toBe("O2");
  });
});
