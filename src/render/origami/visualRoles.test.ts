import {
  compiledAdvancedOrigamiArithmeticFixtures,
  simplePointToPointFoldScene,
} from "../../domain/origami/examples";
import { evaluateOrigamiReveal } from "../../domain/origami/reveal/evaluateOrigamiReveal";
import {
  ORIGAMI_VISUAL_ROLE_DEFINITIONS,
  buildOrigamiVisualRoleMap,
  origamiVisualRoleClassName,
  type OrigamiVisualRole,
} from "./visualRoles";

describe("origami visual roles", () => {
  it("defines the complete N2 explanation role vocabulary", () => {
    const roles = ORIGAMI_VISUAL_ROLE_DEFINITIONS.map(({ role }) => role);
    const expectedRoles: OrigamiVisualRole[] = [
      "source-geometry",
      "guide",
      "active-crease",
      "mountain-valley-candidate",
      "reflected-geometry",
      "selected-intersection",
      "extracted-result",
      "hidden-future",
      "degeneracy-warning",
    ];

    expect(roles).toEqual(expectedRoles);
    expect(new Set(roles).size).toBe(expectedRoles.length);
    expect(
      ORIGAMI_VISUAL_ROLE_DEFINITIONS.every(
        ({ label, description }) => label.length > 0 && description.length > 0,
      ),
    ).toBe(true);
    expect(roles.map(origamiVisualRoleClassName)).toEqual(
      expectedRoles.map((role) => `origami-visual-${role}`),
    );
  });

  it("classifies active macro geometry for explanation rendering", () => {
    const { scene } = compiledAdvancedOrigamiArithmeticFixtures().find(
      ({ operation }) => operation === "mul",
    )!;
    const step = scene.steps.find(({ operation }) => operation === "mul")!;
    const roles = buildOrigamiVisualRoleMap(scene, step.id);

    expect(roles["origami-segment-1"]).toContain("source-geometry");
    expect(roles["origami-unit-segment-1"]).toContain("guide");
    expect(roles["origami-guide-line-1"]).toContain("guide");
    expect(roles["origami-crease-3"]).toEqual(
      expect.arrayContaining(["active-crease", "mountain-valley-candidate"]),
    );
    expect(roles["origami-intersection-1"]).toContain("selected-intersection");
    expect(roles["origami-segment-3"]).toContain("extracted-result");
  });

  it("marks hidden future objects from reveal state", () => {
    const { scene } = compiledAdvancedOrigamiArithmeticFixtures().find(
      ({ operation }) => operation === "sqrt",
    )!;
    const step = scene.steps.find(({ operation }) => operation === "sqrt")!;
    const roles = buildOrigamiVisualRoleMap(
      scene,
      step.id,
      evaluateOrigamiReveal(scene.revealActions, 0),
    );

    expect(roles["origami-intersection-1"]).toContain("hidden-future");
  });

  it("marks reflected geometry and degeneracy warnings when present", () => {
    expect(
      buildOrigamiVisualRoleMap(simplePointToPointFoldScene())[
        "reflected-point-a"
      ],
    ).toContain("reflected-geometry");

    const { scene } = compiledAdvancedOrigamiArithmeticFixtures().find(
      ({ operation }) => operation === "mul",
    )!;
    const step = scene.steps.find(({ operation }) => operation === "mul")!;
    const roles = buildOrigamiVisualRoleMap(
      {
        ...scene,
        steps: [
          {
            ...step,
            degeneracies: [
              {
                kind: "no-solution",
                message: "Fixture warning.",
                objectIds: ["origami-segment-1"],
              },
            ],
            macroTrace: {
              ...step.macroTrace!,
              degeneracyObjectIds: ["origami-segment-2"],
            },
          },
        ],
      },
      step.id,
    );

    expect(roles["origami-segment-1"]).toContain("degeneracy-warning");
    expect(roles["origami-segment-2"]).toContain("degeneracy-warning");
  });
});
