import type { Expr } from "../../domain/expression/types";
import { formatExpression } from "../../domain/expression/format";
const children = (expr: Expr): Expr[] =>
  expr.kind === "sqrt"
    ? [expr.value]
    : expr.kind === "pow"
      ? [expr.base]
      : "left" in expr
        ? [expr.left, expr.right]
        : [];
export function ExpressionTree({
  expression,
  activeExpression,
  onSelect,
  originalExpression,
  simplifiedExpression,
}: {
  expression: Expr;
  activeExpression?: string;
  onSelect?: (expression: string) => void;
  originalExpression?: string;
  simplifiedExpression?: string;
}) {
  const render = (expr: Expr): React.ReactNode => {
    const label = formatExpression(expr);
    return (
      <li key={label} className={label === activeExpression ? "active" : ""}>
        <button type="button" onClick={() => onSelect?.(label)}>
          {label}
        </button>
        {children(expr).length > 0 && <ul>{children(expr).map(render)}</ul>}
      </li>
    );
  };
  return (
    <section className="expression-tree">
      <h2>Expression tree</h2>
      {originalExpression && (
        <p className="tree-equivalence">
          <span>{originalExpression}</span>
          {simplifiedExpression &&
            simplifiedExpression !== originalExpression && (
              <strong> → {simplifiedExpression}</strong>
            )}
        </p>
      )}
      <ul>{render(expression)}</ul>
    </section>
  );
}
