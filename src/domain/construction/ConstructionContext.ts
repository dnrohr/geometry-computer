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
    return step;
  }
  addReveal(action: RevealAction) {
    this.revealActions.push(action);
  }
  addProof(proof: OperationProof) {
    if (!this.proofs.some(({ id }) => id === proof.id)) this.proofs.push(proof);
  }
  trace(): ConstructionTrace {
    return {
      nodes: [],
      steps: this.steps,
      revealActions: this.revealActions,
      proofs: this.proofs,
    };
  }
}
