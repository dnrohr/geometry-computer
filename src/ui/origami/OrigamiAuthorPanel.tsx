import { forwardRef, useImperativeHandle, useState } from "react";
import type { GuidedFoldRequest } from "../../domain/origami/guidedFold";
import type { Point2 } from "../../domain/geometry/types";

type Operation = Exclude<GuidedFoldRequest["operation"], "formal-axiom">;
type Values = {
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  px: number;
  py: number;
  sourceAngle: number;
  targetAngle: number;
  sourceY: number;
  targetY: number;
  angle: number;
  targetX: number;
  candidate: number;
};
const defaults: Values = {
  sx: 2,
  sy: 3,
  tx: 8,
  ty: 3,
  px: 5,
  py: 3,
  sourceAngle: 0,
  targetAngle: 90,
  sourceY: 1,
  targetY: 5,
  angle: 90,
  targetX: 8,
  candidate: 0,
};

const NumberField = ({
  label,
  name,
  values,
  setValues,
}: {
  label: string;
  name: keyof Values;
  values: Values;
  setValues: (values: Values) => void;
}) => (
  <label>
    {label}
    <input
      type="number"
      step="0.1"
      value={values[name]}
      onChange={(event) =>
        setValues({ ...values, [name]: Number(event.target.value) })
      }
    />
  </label>
);

export type OrigamiAuthorHandle = { applyCanvasPoint: (point: Point2) => void };

export const OrigamiAuthorPanel = forwardRef<
  OrigamiAuthorHandle,
  {
    onCompile: (request: GuidedFoldRequest) => void;
    onUndo: () => void;
    onRedo: () => void;
    onReset: () => void;
    canUndo: boolean;
    canRedo: boolean;
    error?: string;
  }
>(function OrigamiAuthorPanel(
  { onCompile, onUndo, onRedo, onReset, canUndo, canRedo, error },
  ref,
) {
  const [operation, setOperation] = useState<Operation>("point-to-point");
  const [movingSide, setMovingSide] = useState<"left" | "right">("left");
  const [branch, setBranch] = useState<"internal" | "external">("internal");
  const [values, setValues] = useState(defaults);
  const [pickField, setPickField] = useState<"source" | "target" | "through">(
    "source",
  );
  useImperativeHandle(
    ref,
    () => ({
      applyCanvasPoint: (point) =>
        setValues((current) =>
          pickField === "source"
            ? {
                ...current,
                sx: Number(point.x.toFixed(2)),
                sy: Number(point.y.toFixed(2)),
              }
            : pickField === "target"
              ? {
                  ...current,
                  tx: Number(point.x.toFixed(2)),
                  ty: Number(point.y.toFixed(2)),
                }
              : {
                  ...current,
                  px: Number(point.x.toFixed(2)),
                  py: Number(point.y.toFixed(2)),
                },
        ),
    }),
    [pickField],
  );
  const build = (): GuidedFoldRequest => {
    const base = { title: "My guided fold", movingSide };
    if (operation === "point-to-point")
      return {
        ...base,
        operation,
        source: { x: values.sx, y: values.sy },
        target: { x: values.tx, y: values.ty },
      };
    if (operation === "line-to-line")
      return {
        ...base,
        operation,
        sourceAngle: values.sourceAngle,
        targetAngle: values.targetAngle,
        branch,
      };
    if (operation === "parallel")
      return {
        ...base,
        operation,
        sourceY: values.sourceY,
        targetY: values.targetY,
      };
    if (operation === "through-point")
      return {
        ...base,
        operation,
        through: { x: values.px, y: values.py },
        angle: values.angle,
      };
    return {
      ...base,
      operation,
      source: { x: values.sx, y: values.sy },
      targetX: values.targetX,
      through: { x: values.px, y: values.py },
      candidate: values.candidate,
    };
  };
  return (
    <section className="origami-author" aria-labelledby="origami-author-title">
      <div>
        <p className="section-label">Guided authoring</p>
        <h2 id="origami-author-title">Create a fold</h2>
        <p>
          Choose a geometric constraint. The domain computes the crease; the
          renderer only presents it.
        </p>
      </div>
      <div className="origami-author-fields">
        <label>
          Fold operation
          <select
            value={operation}
            onChange={(event) => setOperation(event.target.value as Operation)}
          >
            <option value="point-to-point">Place one point onto another</option>
            <option value="line-to-line">Place one line onto another</option>
            <option value="parallel">Match parallel lines</option>
            <option value="through-point">Crease through a point</option>
            <option value="point-to-line-through-point">
              Place point on line through point
            </option>
          </select>
        </label>
        <label>
          Moving side
          <select
            value={movingSide}
            onChange={(event) =>
              setMovingSide(event.target.value as "left" | "right")
            }
          >
            <option value="left">Left of crease</option>
            <option value="right">Right of crease</option>
          </select>
        </label>
        {(operation === "point-to-point" ||
          operation === "point-to-line-through-point") && (
          <>
            <NumberField
              label="Source X"
              name="sx"
              values={values}
              setValues={setValues}
            />
            <NumberField
              label="Source Y"
              name="sy"
              values={values}
              setValues={setValues}
            />
          </>
        )}
        {operation === "point-to-point" && (
          <>
            <NumberField
              label="Target X"
              name="tx"
              values={values}
              setValues={setValues}
            />
            <NumberField
              label="Target Y"
              name="ty"
              values={values}
              setValues={setValues}
            />
          </>
        )}
        {operation === "line-to-line" && (
          <>
            <NumberField
              label="Source line angle"
              name="sourceAngle"
              values={values}
              setValues={setValues}
            />
            <NumberField
              label="Target line angle"
              name="targetAngle"
              values={values}
              setValues={setValues}
            />
            <label>
              Angle-bisector branch
              <select
                value={branch}
                onChange={(event) =>
                  setBranch(event.target.value as typeof branch)
                }
              >
                <option value="internal">Internal</option>
                <option value="external">External</option>
              </select>
            </label>
          </>
        )}
        {operation === "parallel" && (
          <>
            <NumberField
              label="Source line Y"
              name="sourceY"
              values={values}
              setValues={setValues}
            />
            <NumberField
              label="Target line Y"
              name="targetY"
              values={values}
              setValues={setValues}
            />
          </>
        )}
        {(operation === "through-point" ||
          operation === "point-to-line-through-point") && (
          <>
            <NumberField
              label="Through point X"
              name="px"
              values={values}
              setValues={setValues}
            />
            <NumberField
              label="Through point Y"
              name="py"
              values={values}
              setValues={setValues}
            />
          </>
        )}
        {operation === "through-point" && (
          <NumberField
            label="Crease angle"
            name="angle"
            values={values}
            setValues={setValues}
          />
        )}
        {operation === "point-to-line-through-point" && (
          <>
            <NumberField
              label="Vertical target line X"
              name="targetX"
              values={values}
              setValues={setValues}
            />
            <label>
              Real crease candidate
              <select
                value={values.candidate}
                onChange={(event) =>
                  setValues({
                    ...values,
                    candidate: Number(event.target.value),
                  })
                }
              >
                <option value="0">Candidate 1</option>
                <option value="1">Candidate 2</option>
              </select>
            </label>
          </>
        )}
        <label>
          Canvas click fills
          <select
            value={pickField}
            onChange={(event) =>
              setPickField(event.target.value as typeof pickField)
            }
          >
            <option value="source">Source point</option>
            <option value="target">Target point</option>
            <option value="through">Through point</option>
          </select>
        </label>
      </div>
      <div className="origami-author-actions">
        <button type="button" onClick={() => onCompile(build())}>
          Compute fold
        </button>
        <button type="button" onClick={onUndo} disabled={!canUndo}>
          Undo
        </button>
        <button type="button" onClick={onRedo} disabled={!canRedo}>
          Redo
        </button>
        <button type="button" onClick={onReset}>
          Reset to examples
        </button>
      </div>
      {error && (
        <p className="origami-author-error" role="alert">
          {error} Your last valid construction is unchanged.
        </p>
      )}
    </section>
  );
});
