import type {
  OrigamiFoldScene,
  OrigamiFoldStep,
  OrigamiObject,
} from "../../domain/origami/types";
import type { OrigamiObjectRevealState } from "../../domain/origami/reveal/evaluateOrigamiReveal";

export type OrigamiVisualRole =
  | "source-geometry"
  | "guide"
  | "active-crease"
  | "mountain-valley-candidate"
  | "reflected-geometry"
  | "selected-intersection"
  | "extracted-result"
  | "hidden-future"
  | "degeneracy-warning";

export type OrigamiVisualRoleMap = Record<string, OrigamiVisualRole[]>;

export type OrigamiVisualRoleDefinition = {
  role: OrigamiVisualRole;
  label: string;
  description: string;
};

export const ORIGAMI_VISUAL_ROLE_DEFINITIONS: OrigamiVisualRoleDefinition[] = [
  {
    role: "source-geometry",
    label: "Source geometry",
    description: "Input or source objects used by the active fold or macro.",
  },
  {
    role: "guide",
    label: "Guide",
    description: "Unit references and guide lines that set up a construction.",
  },
  {
    role: "active-crease",
    label: "Active crease",
    description: "Creases belonging to the selected fold step.",
  },
  {
    role: "mountain-valley-candidate",
    label: "Mountain/valley candidate",
    description:
      "Unassigned creases that may later receive a mountain or valley assignment.",
  },
  {
    role: "reflected-geometry",
    label: "Reflected geometry",
    description: "Reflected points or reflected objects produced by a fold.",
  },
  {
    role: "selected-intersection",
    label: "Selected intersection",
    description:
      "The chosen point or intersection used by the active construction branch.",
  },
  {
    role: "extracted-result",
    label: "Extracted result",
    description: "Result segments produced by a macro or final expression.",
  },
  {
    role: "hidden-future",
    label: "Hidden future",
    description:
      "Objects hidden or quieted by the current reveal state until their step is reached.",
  },
  {
    role: "degeneracy-warning",
    label: "Degeneracy warning",
    description: "Objects attached to a degeneracy or rejected branch.",
  },
];

const addRole = (
  roles: Map<string, Set<OrigamiVisualRole>>,
  objectId: string,
  role: OrigamiVisualRole,
) => {
  const objectRoles = roles.get(objectId) ?? new Set<OrigamiVisualRole>();
  objectRoles.add(role);
  roles.set(objectId, objectRoles);
};

const addIds = (
  roles: Map<string, Set<OrigamiVisualRole>>,
  objectIds: string[],
  role: OrigamiVisualRole,
) => objectIds.forEach((objectId) => addRole(roles, objectId, role));

const objectVisualRoles = (
  object: OrigamiObject,
  activeStep: OrigamiFoldStep | undefined,
  roles: Map<string, Set<OrigamiVisualRole>>,
) => {
  if (object.data.kind === "reflected-point") {
    addRole(roles, object.id, "reflected-geometry");
  }
  if (
    object.data.kind === "crease" &&
    object.data.assignment === "unassigned"
  ) {
    addRole(roles, object.id, "mountain-valley-candidate");
  }
  if (object.role === "result") {
    addRole(roles, object.id, "extracted-result");
  }
  if (activeStep?.inputObjectIds.includes(object.id)) {
    addRole(roles, object.id, "source-geometry");
  }
};

export function buildOrigamiVisualRoleMap(
  scene: OrigamiFoldScene,
  activeStepId?: string,
  renderStates: Record<string, OrigamiObjectRevealState> = {},
): OrigamiVisualRoleMap {
  const roles = new Map<string, Set<OrigamiVisualRole>>();
  const activeStep = scene.steps.find(({ id }) => id === activeStepId);
  const objectById = new Map(
    scene.objects.map((object) => [object.id, object]),
  );

  scene.objects.forEach((object) => {
    objectVisualRoles(object, activeStep, roles);
    if (
      renderStates[object.id]?.future ||
      renderStates[object.id]?.visible === false
    ) {
      addRole(roles, object.id, "hidden-future");
    }
  });

  if (activeStep) {
    addIds(roles, activeStep.inputObjectIds, "source-geometry");
    addIds(
      roles,
      activeStep.outputObjectIds.filter(
        (objectId) => objectById.get(objectId)?.data.kind === "crease",
      ),
      "active-crease",
    );
    addIds(
      roles,
      activeStep.degeneracies?.flatMap(({ objectIds }) => objectIds) ?? [],
      "degeneracy-warning",
    );

    const trace = activeStep.macroTrace;
    if (trace) {
      addIds(roles, trace.sourceSegmentObjectIds, "source-geometry");
      addIds(roles, trace.unitReferenceObjectIds, "guide");
      addIds(roles, trace.guideLineObjectIds, "guide");
      addIds(roles, trace.foldCreaseObjectIds, "active-crease");
      addIds(roles, trace.foldCreaseObjectIds, "mountain-valley-candidate");
      addIds(roles, trace.reflectedObjectIds, "reflected-geometry");
      addIds(
        roles,
        trace.selectedIntersectionObjectIds,
        "selected-intersection",
      );
      addIds(roles, trace.resultSegmentObjectIds, "extracted-result");
      addIds(roles, trace.degeneracyObjectIds, "degeneracy-warning");
    }
  }

  return Object.fromEntries(
    [...roles.entries()].map(([objectId, objectRoles]) => [
      objectId,
      [...objectRoles],
    ]),
  );
}

export const origamiVisualRoleClassName = (role: OrigamiVisualRole) =>
  `origami-visual-${role}`;
