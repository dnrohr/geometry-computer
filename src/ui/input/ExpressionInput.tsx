export function ExpressionInput({
  expression,
  values,
  error,
  onExpression,
  onValues,
  onCompile,
}: {
  expression: string;
  values: Record<string, number>;
  error?: string;
  onExpression: (value: string) => void;
  onValues: (values: Record<string, number>) => void;
  onCompile: () => void;
}) {
  return (
    <form
      className="expression-input"
      onSubmit={(event) => {
        event.preventDefault();
        onCompile();
      }}
    >
      <label>
        Expression
        <input
          value={expression}
          onChange={(event) => onExpression(event.target.value)}
          aria-describedby={error ? "expression-error" : undefined}
        />
      </label>
      <div className="value-inputs">
        {["a", "b", "x", "y"].map((name) => (
          <label key={name}>
            {name}
            <input
              type="number"
              step="any"
              value={values[name] ?? 1}
              onChange={(event) =>
                onValues({ ...values, [name]: Number(event.target.value) })
              }
            />
          </label>
        ))}
      </div>
      <button type="submit">Compile construction</button>
      {error && (
        <p id="expression-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
