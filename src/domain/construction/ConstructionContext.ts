import type {
  ConstructionStep,
  ConstructionTrace,
  OperationProof,
  RevealAction,
} from "./types";
import type { GeomObject } from "../geometry/types";

export class ConstructionError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
  }
}
export class IdAllocator {
  private counts = new Map<string, number>();
  next(prefix: string) {
    const count = (this.counts.get(prefix) ?? 0) + 1;
    this.counts.set(prefix, count);
    return `${prefix}-${count}`;
  }
}
export class ConstructionContext {
  readonly ids = new IdAllocator();
  readonly values = new Map<string, GeomObject>();
  readonly objects: GeomObject[] = [];
  readonly steps: ConstructionStep[] = [];
  readonly revealActions: RevealAction[] = [];
  readonly proofs: OperationProof[] = [];
  registerValue(key: string, object: GeomObject) {
    if (this.objects.some(({ id }) => id === object.id))
      throw new ConstructionError(
        `Duplicate object ${object.id}.`,
        "DUPLICATE_ID",
      );
    this.objects.push(object);
    this.values.set(key, object);
    return object;
  }
  addObject(object: GeomObject) {
    if (this.objects.some(({ id }) => id === object.id))
      throw new ConstructionError(
        `Duplicate object ${object.id}.`,
        "DUPLICATE_ID",
      );
    this.objects.push(object);
    return object;
  }
  requireValue(key: string) {
    const value = this.values.get(key);
    if (!value)
      throw new ConstructionError(
        `No constructed value for ${key}.`,
        "MISSING_VALUE",
      );
    return value;
  }
  addStep(step: ConstructionStep) {
    this.steps.push(step);
    step.inputObjectIds.forEach((id) => {
      const object = this.objects.find((candidate) => candidate.id === id);
      if (object && !object.usedByStepIds.includes(step.id))
        object.usedByStepIds.push(step.id);
    });
    return step;
  }
  addReveal(action: RevealAction) {
    this.revealActions.push(action);
  }
  revealObject(
    objectId: string,
    stepId: string,
    animation: RevealAction["animation"] = "draw",
  ) {
    const index = this.revealActions.length;
    const start = Math.min(0.96, index * 0.025);
    this.addReveal({
      id: this.ids.next("reveal"),
      stepId,
      objectId,
      start,
      end: Math.min(1, start + 0.07),
      animation,
    });
  }
  addProof(proof: OperationProof) {
    if (!this.proofs.some(({ id }) => id === proof.id)) this.proofs.push(proof);
  }
  trace(): ConstructionTrace {
    const stepIndex = new Map(this.steps.map((step, index) => [step.id, index]));
    const stepCount = Math.max(1, this.steps.length);
    const actionsByStep = new Map<string, RevealAction[]>();
    this.revealActions.forEach((action) => {
      const actions = actionsByStep.get(action.stepId) ?? [];
      actions.push(action);
      actionsByStep.set(action.stepId, actions);
    });
    const revealActions = this.revealActions.map((action) => {
      const index = stepIndex.get(action.stepId) ?? 0;
      const siblings = actionsByStep.get(action.stepId) ?? [action];
      const siblingIndex = siblings.indexOf(action);
      const stepStart = index / stepCount;
      const stepEnd = (index + 1) / stepCount;
      const slice = (stepEnd - stepStart) / siblings.length;
      return {
        ...action,
        start: stepStart + siblingIndex * slice,
        end: stepStart + (siblingIndex + 1) * slice,
      };
    });
    return {
      nodes: [],
      steps: this.steps,
      revealActions,
      proofs: this.proofs,
    };
  }
}
