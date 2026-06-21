import { useMemo, useState } from "react";
import {
  buildConstructionPlan,
  evaluateExpression,
  parseExpression,
} from "./domain/expression";
import { ConstructionDiagram } from "./components/ConstructionDiagram";
import "./App.css";

const examples = ["sqrt(2)", "(1 + sqrt(5)) / 2", "sqrt(3 + sqrt(2))"];

function App() {
  const [source, setSource] = useState(examples[1]);
  const [selectedStep, setSelectedStep] = useState(0);
  const result = useMemo(() => {
    try {
      const expression = parseExpression(source);
      return {
        value: evaluateExpression(expression),
        steps: buildConstructionPlan(expression),
        error: null,
      };
    } catch (error) {
      return {
        value: null,
        steps: [],
        error: error instanceof Error ? error.message : "Expression is invalid",
      };
    }
  }, [source]);

  return (
    <main className="app-shell">
      <header className="masthead">
        <div>
          <p className="eyebrow">Compass · Straightedge · Algebra</p>
          <h1>Geometry Computer</h1>
        </div>
        <p className="lede">
          Translate constructible arithmetic into a sequence of geometric length
          operations.
        </p>
      </header>

      <section className="workbench" aria-labelledby="workbench-title">
        <div className="expression-panel">
          <p className="section-label">Expression</p>
          <h2 id="workbench-title">What length should we construct?</h2>
          <label htmlFor="expression">
            Use numbers, arithmetic, and sqrt(…)
          </label>
          <input
            id="expression"
            value={source}
            onChange={(event) => setSource(event.target.value)}
            spellCheck={false}
            aria-describedby="expression-feedback"
          />

          <div className="examples" aria-label="Example expressions">
            {examples.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setSource(example)}
              >
                {example}
              </button>
            ))}
          </div>

          <div
            id="expression-feedback"
            className={result.error ? "feedback error" : "feedback"}
            role={result.error ? "alert" : "status"}
          >
            {result.error ? (
              result.error
            ) : (
              <>
                <span>Computed length</span>
                <strong>{result.value?.toPrecision(10)}</strong>
              </>
            )}
          </div>
        </div>

        <div className="plan-panel">
          <p className="section-label">Construction plan</p>
          <h2>Dependency order</h2>
          {result.steps.length ? (
            <ol>
              {result.steps.map((step, index) => (
                <li
                  key={step.id}
                  className={selectedStep === index ? "active" : ""}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedStep(index)}
                    aria-pressed={selectedStep === index}
                  >
                    <span>{step.id}</span>
                    {step.description}
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <p className="empty-plan">
              {result.error
                ? "Correct the expression to generate a plan."
                : "A constant length needs no derived operations."}
            </p>
          )}
        </div>
      </section>
      {result.steps.length > 0 && (
        <ConstructionDiagram
          step={result.steps[Math.min(selectedStep, result.steps.length - 1)]}
        />
      )}
    </main>
  );
}

export default App;
