import "./App.css";

function App() {
  return (
    <main className="app-shell">
      <section className="intro" aria-labelledby="page-title">
        <p className="eyebrow">Compass · Straightedge · Algebra</p>
        <h1 id="page-title">Geometry Computer</h1>
        <p className="lede">
          Construct algebraic lengths as animated, explainable geometric proofs.
        </p>
        <div className="construction-preview" aria-hidden="true">
          <svg viewBox="0 0 640 220" role="img">
            <line x1="72" y1="164" x2="568" y2="164" />
            <circle cx="216" cy="164" r="92" />
            <path d="M216 164 L390 72 L510 164" />
            <circle className="point" cx="216" cy="164" r="7" />
            <circle className="point result" cx="510" cy="164" r="7" />
          </svg>
        </div>
        <p className="status">
          Project foundation ready. Constructions come next.
        </p>
      </section>
    </main>
  );
}

export default App;
