export type OrigamiVariableControl = {
  name: string;
  value: number;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
};

export const DEFAULT_ORIGAMI_VARIABLE_RANGE = {
  min: -10,
  max: 10,
  step: 0.25,
};

export const clampOrigamiVariableValue = (
  value: number,
  min = DEFAULT_ORIGAMI_VARIABLE_RANGE.min,
  max = DEFAULT_ORIGAMI_VARIABLE_RANGE.max,
) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : 0));

export function origamiVariableControls(
  variables: string[],
  values: Record<string, number>,
): OrigamiVariableControl[] {
  return variables.map((name) => {
    const defaultValue = clampOrigamiVariableValue(values[name] ?? 1);
    return {
      name,
      value: defaultValue,
      defaultValue,
      ...DEFAULT_ORIGAMI_VARIABLE_RANGE,
    };
  });
}
