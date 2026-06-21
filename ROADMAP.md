# Geometry Computer ROADMAP

Repository: <https://github.com/dnrohr/geometry-computer>

## 0. Working Agreement for Agents

This roadmap is written so individual tasks can be handed to a coding agent with minimal extra context. Treat each milestone or task group as an independently verifiable change.

### Required workflow after every major change

A **major change** means any change that adds a feature, changes data models, adds a new construction macro, changes rendering behavior, changes tests/build tooling, or modifies public documentation.

After every major change:

1. Run the relevant test suite.
2. Run type checking.
3. Run linting/formatting checks.
4. Run the production build.
5. Update documentation for the change.
6. Commit with a clear message.
7. Push to `main`.

Canonical command sequence once the project scripts exist:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check

git status
git add .
git commit -m "<clear imperative commit message>"
git push origin main
```

If a command does not exist yet, add it as part of the tooling milestone before relying on it. If a command fails, fix the failure before committing. Do not push broken code to `main`.

### Agent behavior rules

- Inspect the repository before editing. Do not assume the repo is empty.
- Prefer small, reviewable commits over large rewrites.
- Keep implementation simple unless a task explicitly asks for abstraction.
- Keep all math/construction logic deterministic and testable outside the UI.
- Avoid introducing heavy graphics libraries in the MVP.
- Prefer plain TypeScript, React, SVG, and CSS for the initial implementation.
- Do not implement arbitrary geometric layout solving in the MVP.
- Use canonical templates for each construction operation.
- Preserve object provenance: every rendered object should know which step created it and what expression/construction object it represents.
- Document any mathematical assumptions, branch choices, or degeneracy handling.

---

## 1. Product Vision

Build a web application that compiles algebraic expressions in constructible lengths into readable compass-and-straightedge construction narratives.

The application should feel like a **scroll-driven animated construction proof**:

- The user enters or selects an algebraic expression.
- The system simplifies or normalizes the expression where useful.
- The expression is compiled into arithmetic construction operations.
- Each operation is rendered as a canonical geometric construction.
- Scrolling reveals lines, circles, arcs, intersections, and resulting segments over construction time.
- Hovering or clicking an operation reveals a proof/explanation of why that construction realizes the arithmetic operation.
- Hovering or clicking a geometric object highlights the corresponding construction step, and hovering/clicking a step highlights the relevant geometry.

Initial example:

```text
Inputs: lengths a, b, unit 1
Expression: 3a^2 + 4ab + b^2
Simplified: (3a + b)(a + b)
Construction:
  x = 3a + b
  y = a + b
  r = x * y
Result:
  r = 3a^2 + 4ab + b^2
```

---

## 2. MVP Scope

### In scope for MVP

- Web app using TypeScript and React.
- SVG-based construction rendering.
- Scroll-driven reveal of construction steps.
- Expression examples hardcoded initially, then parsed later.
- Arithmetic construction macros for:
  - given input segment
  - constant integer multiples
  - addition
  - subtraction
  - multiplication
  - division
- Optional after arithmetic MVP:
  - squaring as a named specialization of multiplication
  - square root using the geometric-mean/semicircle construction
- Proof cards for multiplication, division, squaring, and square root.
- Object/step bidirectional highlighting.
- Object inspector showing provenance.
- Clean final result frame.
- Tests for math models, construction DAG generation, and geometry primitives.

### Explicit non-goals for MVP

- No general automated theorem proving.
- No arbitrary Euclidean proposition search.
- No full computer algebra system.
- No arbitrary freeform diagram layout solver.
- No Canvas/WebGL renderer unless SVG proves inadequate.
- No support for cubic roots, transcendental functions, or non-constructible operations.
- No guarantee that every algebraically valid expression has an aesthetically optimal diagram.
- No user accounts, persistence, sharing, or collaboration features.

---

## 3. Recommended Tech Stack

Use this unless the existing repository already has a different compatible stack.

- Vite
- React
- TypeScript
- SVG
- CSS Modules or plain CSS
- Vitest for unit tests
- Testing Library for React component tests
- Playwright for later end-to-end interaction tests
- ESLint
- Prettier

Project scripts should eventually include:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

---

## 4. Core Concepts and Data Model

The main design principle is separation of concerns:

```text
Expression AST
  -> Simplified/normalized expression DAG
  -> Construction DAG
  -> Macro construction trace
  -> Primitive geometry trace
  -> SVG scene graph
  -> Scroll/hover/click interaction state
```

### 4.1 Expression AST

Represents algebraic input independent of geometry.

Suggested types:

```ts
export type Expr =
  | { kind: "const"; value: number }
  | { kind: "var"; name: string }
  | { kind: "add"; left: Expr; right: Expr }
  | { kind: "sub"; left: Expr; right: Expr }
  | { kind: "mul"; left: Expr; right: Expr }
  | { kind: "div"; left: Expr; right: Expr }
  | { kind: "pow"; base: Expr; exponent: number }
  | { kind: "sqrt"; value: Expr };
```

MVP can hardcode example ASTs before implementing a parser.

### 4.2 Algebraic construction nodes

Represents arithmetic operations to be constructed.

```ts
export type ConstructionOpKind =
  | "given"
  | "constant"
  | "add"
  | "sub"
  | "mul"
  | "div"
  | "square"
  | "sqrt";

export type ConstructionNode = {
  id: string;
  kind: ConstructionOpKind;
  label: string;
  expressionLatex: string;
  inputs: string[];
  output: string;
  assumptions?: string[];
};
```

### 4.3 Geometry objects

Every visible object should have identity, role, provenance, and dependencies.

```ts
export type GeomObjectKind =
  | "point"
  | "segment"
  | "line"
  | "ray"
  | "circle"
  | "arc"
  | "path"
  | "label"
  | "triangle"
  | "region";

export type GeomRole =
  | "input"
  | "unit"
  | "active-construction"
  | "scaffold"
  | "intermediate"
  | "result"
  | "proof-highlight"
  | "ghost";

export type GeomObject = {
  id: string;
  kind: GeomObjectKind;
  role: GeomRole;
  label?: string;
  createdByStepId: string;
  usedByStepIds: string[];
  represents?: string;
  dependsOnObjectIds: string[];
  data: unknown;
};
```

### 4.4 Construction steps

Separate macro operations from primitive geometric moves.

```ts
export type ConstructionStep = {
  id: string;
  parentStepId?: string;
  level: "macro" | "primitive";
  title: string;
  summary: string;
  operation?: ConstructionOpKind;
  inputObjectIds: string[];
  outputObjectIds: string[];
  createdObjectIds: string[];
  proofId?: string;
};
```

### 4.5 Reveal actions

Scroll state should not be hardwired to rendering code. It should be data-driven.

```ts
export type RevealAction = {
  id: string;
  stepId: string;
  objectId: string;
  start: number;
  end: number;
  animation:
    | "draw"
    | "fade-in"
    | "fade-out"
    | "pulse"
    | "highlight"
    | "select"
    | "dim";
};
```

The renderer receives:

```ts
{
  objects: GeomObject[];
  steps: ConstructionStep[];
  revealActions: RevealAction[];
  currentProgress: number;
  activeStepId: string;
  highlightedObjectIds: string[];
}
```

---

## 5. Visual and Interaction Requirements

### 5.1 Scroll-driven construction time

Use a sticky SVG canvas and a scrolling step column.

- SVG canvas remains visible while user scrolls.
- Each scroll section corresponds to a macro or primitive step.
- Scroll progress partially draws active lines/arcs/circles.
- Completed objects remain visible or fade according to their role.
- Future objects remain hidden.

### 5.2 Animation conventions

Use consistent animation signatures.

#### Lines and segments

- Animate with SVG path length.
- Use `stroke-dasharray` and `stroke-dashoffset`.
- Draw from defining point toward target point when direction is meaningful.

#### Circles

- First pulse the center point.
- Highlight the radius segment.
- Show faint ghost circle.
- Draw circle around circumference.

#### Arcs

- Draw along arc direction.
- Use arc labels only when needed.

#### Intersections

Treat intersections as events.

- When two objects intersect, briefly highlight both parent objects.
- Show candidate intersection points.
- If multiple intersections exist, display both briefly.
- Select the intended point with a pulse or snap animation.
- Fade unselected branch candidates.
- Create a label only after selection.

#### Segment transfer

- Highlight source segment.
- Show a ghost copy moving or appearing at target location.
- Commit the copied segment.
- Label endpoint if the copy creates a named value.

### 5.3 Bidirectional highlighting

Hover/click on diagram object:

- Highlight object.
- Highlight creating step.
- Highlight expression node if present.
- Show object inspector.

Hover/click on construction step:

- Highlight all inputs and outputs for that step.
- Dim unrelated scaffolding.
- Show proof card if the step has one.

Hover/click on expression tree node:

- Highlight all construction steps that produce or use that expression.
- Highlight final represented segment if already constructed.

### 5.4 Proof cards

Proof cards are attached to macro operations, not primitive steps.

Each proof card should include:

- Operation name.
- Inputs.
- Construction idea.
- Key geometric invariant.
- Algebraic conclusion.
- Assumptions/degeneracies.

Proof claims should be linked to diagram highlights.

```ts
export type OperationProof = {
  id: string;
  title: string;
  operation: ConstructionOpKind;
  intuition: string;
  givens: string[];
  claims: ProofClaim[];
  conclusion: string;
  assumptions?: string[];
};

export type ProofClaim = {
  id: string;
  text: string;
  mathLatex?: string;
  highlightObjectIds: string[];
};
```

### 5.5 Inspector

Clicking any object should reveal:

```text
Object: Z
Kind: point
Defined by: intersection of line l3 and ray m
Created in: Step 4.5
Represents: r = x * y
Depends on: x, y, unit 1
Used by: final result extraction
```

### 5.6 Clean final frame

Every construction should end with a clean summary:

- Inputs visible.
- Final result segment visible.
- Essential construction objects optionally visible.
- Scaffolding hidden or strongly dimmed.
- Algebraic equality displayed.

---

## 6. Canonical Construction Templates

Use canonical layouts. Do not attempt arbitrary automatic layout in the MVP.

### 6.1 Common coordinate setup

Represent a numeric example on an SVG coordinate plane.

- Use a main number line for values.
- Choose origin `O`.
- Choose unit point `U` so `OU = 1`.
- Use directed lengths along the main number line.
- Use an auxiliary ray for multiplication/division.
- Use fixed templates for each operation.

The numeric rendering is illustrative. The construction trace is the mathematical artifact.

### 6.2 Given length

Inputs:

- variable name, e.g. `a`
- sample numeric value for rendering

Output:

- segment on the number line or input palette

Acceptance criteria:

- Input segment appears with label.
- Input segment has provenance.
- Input segment can be highlighted from the step list.

### 6.3 Addition: `r = x + y`

Construction idea:

- Copy segment `y` so it starts at the endpoint of `x`.
- Endpoint becomes `r`.

Macro steps:

1. Highlight `x`.
2. Highlight/copy `y`.
3. Lay copied `y` after `x` on the number line.
4. Mark endpoint `r`.

Proof:

```text
If OX = x and XR = y, then OR = OX + XR = x + y.
```

Tests:

- Numeric output coordinate equals `x + y` within tolerance.
- Step trace contains source, copied segment, endpoint, and result label.

### 6.4 Subtraction: `r = x - y`

Construction idea:

- Copy `y` backward from endpoint of `x`.
- Endpoint becomes `r`.

Proof:

```text
If OX = x and RX = y, then OR = OX - RX = x - y.
```

Requirements:

- Support negative output visually as directed length left of origin.
- Document behavior when result is negative.

### 6.5 Multiplication: `r = x * y`

Construction idea:

- Use similar triangles to scale `y` by `x / 1`.

Canonical template:

- `O`, `U`, and `X` on main number line.
- `OU = 1`.
- `OX = x`.
- `Y` on auxiliary ray with `OY = y`.
- Draw line `UY`.
- Draw line through `X` parallel to `UY`.
- Intersection with auxiliary ray gives `Z` where `OZ = xy`.
- Copy `OZ` back to main result line as `r`.

Proof invariant:

```text
Triangles OXZ and OUY are similar.
OZ / OY = OX / OU.
OZ / y = x / 1.
OZ = xy.
```

Requirements:

- Multiplication proof card highlights `OU`, `OX`, `OY`, `OZ`, `UY`, parallel line, and the two triangles.
- Intersections are animated as events.
- Final result is extracted to a clean result segment.

### 6.6 Squaring: `r = x^2`

Construction idea:

- Special case of multiplication where both inputs are `x`.

Proof invariant:

```text
OZ / x = x / 1.
OZ = x^2.
```

Requirements:

- May reuse multiplication geometry.
- Must have separate operation badge and proof card.
- Should display as `square` in the operation tree rather than generic multiplication if expression originated as `x^2`.

### 6.7 Division: `r = x / y`

Construction idea:

- Use similar triangles to rescale `x` by `1 / y`.

Proof invariant:

```text
Construct triangles so OR / OU = OX / OY.
Given OU = 1, OX = x, OY = y.
Then OR / 1 = x / y.
Therefore OR = x / y.
```

Requirements:

- Detect and report `y = 0` as undefined.
- Do not render invalid division as if defined.
- Proof card must include assumption `y ≠ 0`.

### 6.8 Square root: `r = sqrt(x)`

Construction idea:

- Use the geometric mean construction.

Canonical template:

- Place `AB = 1` and `BC = x` consecutively on a line.
- Draw semicircle with diameter `AC`.
- Erect perpendicular at `B`.
- Let it meet semicircle at `D`.
- Then `BD = sqrt(x)`.

Proof invariant:

```text
Angle ADC is right because it subtends a diameter.
BD is the altitude to the hypotenuse.
BD^2 = AB * BC.
BD^2 = 1 * x = x.
BD = sqrt(x).
```

Requirements:

- Detect and report `x < 0` as not renderable as a real length.
- Show both semicircle and perpendicular construction.
- Treat intersection `D` as a selected branch event.
- Proof card must mention nonnegative root.

---

## 7. Milestones and Agent Tasks

## Milestone 1: Repository bootstrap and quality gates

Goal: Establish a clean TypeScript/React/SVG project with reproducible commands.

### Task 1.1: Inspect repository

Context:

- Repository may be empty or may already contain files.
- Do not overwrite existing work without checking.

Steps:

1. Clone/open repository.
2. Inspect files and package metadata.
3. If project exists, document current structure in `docs/REPO_STATE.md`.
4. If project is empty, create the initial Vite React TypeScript app.
5. Ensure README identifies the project as Geometry Computer.

Acceptance criteria:

- Repository can be installed with `npm install`.
- `README.md` exists and describes the project.
- Existing files are preserved unless intentionally migrated.

Required verification:

```bash
npm install
npm run build
```

Commit:

```bash
git add .
git commit -m "Bootstrap geometry computer project"
git push origin main
```

### Task 1.2: Add test/lint/format/typecheck tooling

Steps:

1. Add Vitest.
2. Add ESLint.
3. Add Prettier.
4. Add TypeScript type checking script.
5. Add the canonical scripts to `package.json`.
6. Add one smoke test.
7. Add basic CI workflow if appropriate.

Acceptance criteria:

- `npm test` passes.
- `npm run typecheck` passes.
- `npm run lint` passes.
- `npm run build` passes.
- `npm run format:check` passes.

Documentation:

- Update `README.md` with setup and verification commands.

Commit:

```bash
git add .
git commit -m "Add quality gates and project scripts"
git push origin main
```

---

## Milestone 2: Domain model for expressions and construction traces

Goal: Create testable non-UI models for expressions, construction nodes, geometry objects, steps, proofs, and reveal actions.

### Task 2.1: Add expression model

Files to create:

```text
src/domain/expression/types.ts
src/domain/expression/format.ts
src/domain/expression/examples.ts
src/domain/expression/types.test.ts
```

Implementation:

1. Define `Expr` union type.
2. Add helpers for constants, variables, add, sub, mul, div, pow, sqrt.
3. Add formatting to plain text and LaTeX.
4. Add example expression for `3a^2 + 4ab + b^2`.
5. Add example simplified expression `(3a + b)(a + b)`.

Tests:

- Formatting `3a^2 + 4ab + b^2` returns stable text.
- LaTeX formatting produces stable output.
- Example expressions compile without type errors.

Documentation:

- Add `docs/DOMAIN_MODEL.md` section for expression AST.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Add expression domain model"
git push origin main
```

### Task 2.2: Add construction trace model

Files to create:

```text
src/domain/construction/types.ts
src/domain/construction/examples.ts
src/domain/construction/types.test.ts
```

Implementation:

1. Define `ConstructionOpKind`.
2. Define `ConstructionNode`.
3. Define `ConstructionStep`.
4. Define `RevealAction`.
5. Define `OperationProof` and `ProofClaim`.
6. Add hardcoded construction trace for `(3a + b)(a + b)` at macro level.

Tests:

- Example trace has unique IDs.
- Every step output references known objects or construction nodes.
- Every proof ID referenced by a step exists.

Documentation:

- Extend `docs/DOMAIN_MODEL.md` with construction trace model.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Add construction trace model"
git push origin main
```

### Task 2.3: Add geometry object model

Files to create:

```text
src/domain/geometry/types.ts
src/domain/geometry/coordinates.ts
src/domain/geometry/types.test.ts
```

Implementation:

1. Define points, segments, lines, rays, circles, arcs, labels, triangles.
2. Define object roles.
3. Define provenance fields.
4. Define coordinate helpers for rendering.
5. Define tolerance utilities for numeric tests.

Tests:

- Create point, segment, line, circle objects.
- Provenance fields are required by constructors.
- Coordinate helpers produce expected values.

Documentation:

- Extend `docs/DOMAIN_MODEL.md` with geometry object model.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Add geometry object model"
git push origin main
```

---

## Milestone 3: Static SVG rendering foundation

Goal: Render geometry objects as SVG without scroll animation yet.

### Task 3.1: Create SVG renderer components

Files to create:

```text
src/render/svg/SvgConstructionCanvas.tsx
src/render/svg/renderObject.tsx
src/render/svg/objectStyles.ts
src/render/svg/SvgConstructionCanvas.test.tsx
```

Implementation:

1. Render points, segments, lines/rays, circles, arcs, labels.
2. Render based on object role.
3. Use semantic CSS classes, not hardcoded inline styling where avoidable.
4. Support viewBox and coordinate conversion.
5. Render unknown object kinds with a safe fallback or omit with warning.

Tests:

- Component renders a point with label.
- Component renders a segment.
- Component renders a circle.
- Role maps to CSS class.

Documentation:

- Add `docs/RENDERING.md` explaining SVG rendering model.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Add static SVG construction renderer"
git push origin main
```

### Task 3.2: Add example static construction scene

Files to create/update:

```text
src/domain/examples/examplePolynomialScene.ts
src/App.tsx
src/App.css
```

Implementation:

1. Create static geometry scene for inputs `a`, `b`, unit `1`, `x = 3a+b`, `y = a+b`, and result placeholder.
2. Render the scene in the app.
3. Include a side panel listing macro steps.
4. No animation yet.

Acceptance criteria:

- Browser displays a diagram and construction steps.
- SVG objects have stable IDs.
- Step list uses the same IDs as domain objects.

Documentation:

- Add screenshot instructions or dev notes to `docs/RENDERING.md`.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Render initial polynomial construction scene"
git push origin main
```

---

## Milestone 4: Scroll-driven reveal system

Goal: Make scroll position drive construction time.

### Task 4.1: Add scroll progress infrastructure

Files to create:

```text
src/ui/scroll/useScrollProgress.ts
src/ui/scroll/ScrollConstructionLayout.tsx
src/ui/scroll/ScrollStep.tsx
src/ui/scroll/useScrollProgress.test.ts
```

Implementation:

1. Create sticky SVG + scroll column layout.
2. Use scroll position to compute global progress from `0` to `1`.
3. Compute active step from scroll section visibility or progress thresholds.
4. Keep implementation simple; use browser APIs directly.
5. Respect reduced-motion preference by allowing instant state changes.

Tests:

- Progress clamps between `0` and `1`.
- Step selection chooses correct active step at thresholds.
- Reduced-motion utility returns expected values when mocked.

Documentation:

- Add `docs/SCROLL_INTERACTION.md`.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Add scroll-driven construction layout"
git push origin main
```

### Task 4.2: Implement reveal-action evaluation

Files to create:

```text
src/domain/reveal/evaluateReveal.ts
src/domain/reveal/evaluateReveal.test.ts
```

Implementation:

1. Given reveal actions and global progress, compute object visibility.
2. Compute partial draw progress for paths, circles, arcs, and segments.
3. Compute active/highlight/dim states.
4. Return a render state independent of React.

Tests:

- Object hidden before reveal start.
- Object partially visible during reveal interval.
- Object fully visible after reveal end.
- Fade-out and dim behavior are deterministic.

Documentation:

- Update `docs/SCROLL_INTERACTION.md` with reveal action semantics.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Add reveal action evaluation"
git push origin main
```

### Task 4.3: Animate SVG drawing from reveal state

Files to update:

```text
src/render/svg/SvgConstructionCanvas.tsx
src/render/svg/renderObject.tsx
src/render/svg/objectStyles.ts
src/App.tsx
```

Implementation:

1. Apply draw progress to SVG elements.
2. Use `stroke-dasharray` and `stroke-dashoffset` where practical.
3. Fade in points and labels.
4. Dim retired scaffolding.
5. Ensure full construction can still render statically when reduced motion is enabled.

Tests:

- Rendering with partial progress applies expected attributes/classes.
- Rendering with full progress shows completed objects.
- Reduced-motion mode does not produce broken invisible objects.

Documentation:

- Update `docs/RENDERING.md` with animation conventions.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Animate SVG construction reveal"
git push origin main
```

---

## Milestone 5: Bidirectional highlighting and object inspector

Goal: Make diagram, step list, and object metadata mutually inspectable.

### Task 5.1: Add interaction state model

Files to create:

```text
src/ui/interaction/interactionState.ts
src/ui/interaction/interactionState.test.ts
```

Implementation:

1. Track active step ID.
2. Track hovered object ID.
3. Track selected object ID.
4. Track hovered/selected step ID.
5. Derive highlighted object IDs from step/object provenance.
6. Derive highlighted step IDs from object provenance.

Tests:

- Hovering object highlights creating step.
- Hovering step highlights input and output objects.
- Selecting object persists inspector target.
- Clearing selection behaves correctly.

Documentation:

- Add interaction section to `docs/SCROLL_INTERACTION.md`.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Add bidirectional interaction state"
git push origin main
```

### Task 5.2: Wire hover/click behavior in UI

Files to update/create:

```text
src/render/svg/SvgConstructionCanvas.tsx
src/ui/steps/ConstructionStepList.tsx
src/ui/inspector/ObjectInspector.tsx
src/ui/inspector/ObjectInspector.test.tsx
```

Implementation:

1. Make SVG objects hoverable/clickable.
2. Make construction steps hoverable/clickable.
3. Highlight corresponding objects and steps.
4. Add object inspector panel.
5. Inspector shows object kind, label, role, created step, dependencies, represented expression, and used-by steps.

Acceptance criteria:

- Hovering a visible segment highlights the corresponding step.
- Hovering a step highlights relevant geometry.
- Clicking an object opens inspector.
- Inspector content is stable and readable.

Documentation:

- Update `docs/INTERACTION.md` or create it if needed.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Connect geometry objects to construction steps"
git push origin main
```

---

## Milestone 6: Proof cards for operations

Goal: Add hover/click proof explanations for complex operations.

### Task 6.1: Add proof-card data for arithmetic operations

Files to create:

```text
src/domain/proofs/arithmeticProofs.ts
src/domain/proofs/arithmeticProofs.test.ts
```

Implementation:

1. Add proof for addition.
2. Add proof for subtraction.
3. Add proof for multiplication.
4. Add proof for division.
5. Add proof for squaring.
6. Add proof for square root, even if square root rendering is implemented later.
7. Link proof claims to semantic object IDs or roles where possible.

Tests:

- Every proof has title, intuition, claims, and conclusion.
- Division proof includes `y ≠ 0` assumption.
- Square root proof includes `x ≥ 0` assumption.
- Multiplication proof includes similar-triangle ratio.

Documentation:

- Add `docs/PROOFS.md` with the explanatory text and invariants.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Add arithmetic operation proofs"
git push origin main
```

### Task 6.2: Build proof card component

Files to create:

```text
src/ui/proofs/ProofCard.tsx
src/ui/proofs/ProofCard.test.tsx
src/ui/proofs/ProofClaim.tsx
```

Implementation:

1. Render operation proof title.
2. Render intuition.
3. Render givens.
4. Render claims.
5. Render conclusion.
6. Render assumptions.
7. Hovering a proof claim should request highlight of linked geometry.
8. Support click/tap expansion for mobile.

Acceptance criteria:

- Proof card appears for multiplication step.
- Hovering a proof claim highlights corresponding diagram objects.
- Proof card works without hover through click/tap.

Documentation:

- Update `docs/PROOFS.md` with UI behavior.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Add interactive proof cards"
git push origin main
```

---

## Milestone 7: Macro construction generators

Goal: Generate construction traces and geometry from operation macros instead of hand-authoring every object.

### Task 7.1: Add construction context and ID allocator

Files to create:

```text
src/domain/construction/ConstructionContext.ts
src/domain/construction/idAllocator.ts
src/domain/construction/ConstructionContext.test.ts
```

Implementation:

1. Maintain map of symbolic values to geometry objects.
2. Maintain list of created objects.
3. Maintain list of steps.
4. Maintain reveal actions.
5. Provide deterministic ID allocation.
6. Provide methods to register objects, steps, and proofs.

Tests:

- IDs are deterministic.
- Registering object stores provenance.
- Looking up a missing object returns controlled error.

Documentation:

- Update `docs/DOMAIN_MODEL.md`.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Add construction generation context"
git push origin main
```

### Task 7.2: Implement addition and subtraction macros

Files to create:

```text
src/domain/construction/macros/addition.ts
src/domain/construction/macros/subtraction.ts
src/domain/construction/macros/arithmeticMacros.test.ts
```

Implementation:

1. Given input value IDs, generate geometry objects for addition.
2. Generate macro step and primitive substeps.
3. Generate reveal actions.
4. Generate provenance links.
5. Generate proof references.
6. Repeat for subtraction.

Tests:

- Addition macro output numeric value equals sum.
- Subtraction macro output numeric value equals difference.
- Negative subtraction result is represented as directed length.
- Steps and objects have unique IDs.

Documentation:

- Update `docs/CONSTRUCTION_MACROS.md`.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Generate addition and subtraction constructions"
git push origin main
```

### Task 7.3: Implement multiplication macro

Files to create/update:

```text
src/domain/construction/macros/multiplication.ts
src/domain/construction/macros/arithmeticMacros.test.ts
```

Implementation:

1. Place `O`, `U`, `X`, and `Y` according to canonical template.
2. Create auxiliary ray.
3. Create line `UY`.
4. Create parallel through `X`.
5. Create intersection point `Z`.
6. Create result extraction segment.
7. Add proof references and reveal actions.
8. Add branch/intersection metadata.

Tests:

- Numeric result equals product.
- Similar-triangle objects are created.
- Intersection event exists.
- Result extraction step exists.
- Proof card references valid objects.

Documentation:

- Update `docs/CONSTRUCTION_MACROS.md` with multiplication construction and proof invariant.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Generate multiplication construction"
git push origin main
```

### Task 7.4: Implement division macro

Files to create/update:

```text
src/domain/construction/macros/division.ts
src/domain/construction/macros/arithmeticMacros.test.ts
```

Implementation:

1. Use canonical similar-triangle division layout.
2. Detect division by zero before rendering.
3. Represent invalid construction as a domain error, not as broken geometry.
4. Add proof references and reveal actions.

Tests:

- Numeric result equals quotient.
- Division by zero returns expected error.
- Assumption `denominator != 0` appears in step/proof metadata.

Documentation:

- Update `docs/CONSTRUCTION_MACROS.md` with division construction and assumptions.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Generate division construction"
git push origin main
```

### Task 7.5: Implement squaring macro

Files to create/update:

```text
src/domain/construction/macros/square.ts
src/domain/construction/macros/arithmeticMacros.test.ts
```

Implementation:

1. Reuse multiplication machinery with same input twice.
2. Preserve operation kind as `square`.
3. Use square-specific proof card.
4. Display square-specific operation badge.

Tests:

- Numeric result equals square.
- Operation kind remains `square`.
- Proof is square proof, not generic multiplication proof.

Documentation:

- Update `docs/CONSTRUCTION_MACROS.md`.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Generate squaring construction"
git push origin main
```

### Task 7.6: Implement square-root macro

Files to create/update:

```text
src/domain/construction/macros/squareRoot.ts
src/domain/construction/macros/arithmeticMacros.test.ts
```

Implementation:

1. Place consecutive segments `1` and `x` on a baseline.
2. Draw semicircle with diameter `1 + x`.
3. Construct perpendicular at the join point.
4. Create intersection with semicircle.
5. Select positive/nonnegative root branch.
6. Extract result segment.
7. Detect negative input before rendering.

Tests:

- Numeric result equals square root.
- Negative input returns expected error.
- Semicircle, perpendicular, and intersection event exist.
- Proof references valid geometry.

Documentation:

- Update `docs/CONSTRUCTION_MACROS.md` with square-root construction.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Generate square-root construction"
git push origin main
```

---

## Milestone 8: Expression compiler

Goal: Compile expression ASTs into construction traces using macro generators.

### Task 8.1: Add expression normalization and simplification hooks

Files to create:

```text
src/domain/expression/normalize.ts
src/domain/expression/simplify.ts
src/domain/expression/simplify.test.ts
```

Implementation:

1. Normalize `pow(x, 2)` to square operation where appropriate.
2. Flatten associative additions/multiplications if helpful.
3. Fold numeric constants where simple.
4. Preserve original expression for display.
5. Allow a manual simplified expression override for examples.

Tests:

- `pow(x, 2)` normalizes to square candidate.
- Simple constants fold.
- Original expression remains available.

Documentation:

- Add `docs/EXPRESSION_COMPILER.md`.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Add expression normalization hooks"
git push origin main
```

### Task 8.2: Compile AST recursively to construction trace

Files to create:

```text
src/domain/compiler/compileExpression.ts
src/domain/compiler/compileExpression.test.ts
```

Implementation:

1. Given expression AST and sample variable values, produce construction scene.
2. Compile variables as given lengths.
3. Compile constants as constructible unit multiples where practical.
4. Compile add/sub/mul/div/square/sqrt using macro generators.
5. Reuse repeated subexpressions when possible.
6. Return domain errors for invalid operations.

Tests:

- Compile `a + b`.
- Compile `a - b`.
- Compile `a * b`.
- Compile `a / b`.
- Compile `a^2`.
- Compile `sqrt(a)`.
- Compile `(3a + b)(a + b)`.
- Final numeric result matches evaluation.

Documentation:

- Update `docs/EXPRESSION_COMPILER.md` with examples.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Compile expressions to construction traces"
git push origin main
```

### Task 8.3: Replace hardcoded scene with compiled example

Files to update:

```text
src/App.tsx
src/domain/examples/examplePolynomialScene.ts
```

Implementation:

1. Use compiler to produce example construction.
2. Keep example expression and sample values in one place.
3. Display original and simplified expression.
4. Display construction trace generated from compiler.

Acceptance criteria:

- App still renders the polynomial example.
- Steps and SVG objects come from compiler output.
- Tests pass.

Documentation:

- Update README with description of the default example.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Use compiler for default construction example"
git push origin main
```

---

## Milestone 9: Expression tree and operation badges

Goal: Improve organizational intelligibility.

### Task 9.1: Add expression tree panel

Files to create:

```text
src/ui/expression/ExpressionTree.tsx
src/ui/expression/ExpressionTree.test.tsx
```

Implementation:

1. Render expression DAG/tree.
2. Show original expression and simplified/compiled expression.
3. Highlight active node from active construction step.
4. Clicking a node highlights corresponding construction steps and geometry.

Acceptance criteria:

- Tree displays `(3a+b)(a+b)` as root with children.
- Active construction step highlights matching tree node.
- Tree node click highlights related geometry.

Documentation:

- Update `docs/INTERACTION.md` with expression tree behavior.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Add synchronized expression tree"
git push origin main
```

### Task 9.2: Add operation badges

Files to create:

```text
src/ui/steps/OperationBadge.tsx
src/ui/steps/OperationBadge.test.tsx
```

Implementation:

1. Show operation kind.
2. Show inputs.
3. Show output.
4. Show method, e.g. `similar-triangle scaling`.
5. Link badge to proof card when present.

Acceptance criteria:

- Multiplication step shows operation, inputs, output, and method.
- Square root step, when present, shows geometric-mean method.
- Badge is readable in narrow layout.

Documentation:

- Update `docs/INTERACTION.md`.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Add operation badges to construction steps"
git push origin main
```

---

## Milestone 10: Input parsing and example gallery

Goal: Let users explore examples without requiring code changes.

### Task 10.1: Add minimal expression parser

Files to create:

```text
src/domain/parser/parseExpression.ts
src/domain/parser/parseExpression.test.ts
```

Implementation:

Support:

- variables: `a`, `b`, `x`, `y`
- numbers: integers and decimals
- operators: `+`, `-`, `*`, `/`, `^`
- parentheses
- `sqrt(...)`

Do not support implicit multiplication initially unless easy and well-tested. It is acceptable to require `3*a^2 + 4*a*b + b^2`.

Tests:

- Parse `a+b`.
- Parse `a-b`.
- Parse `a*b`.
- Parse `a/b`.
- Parse `a^2`.
- Parse `sqrt(a)`.
- Parse `3*a^2 + 4*a*b + b^2`.
- Reject malformed expressions with readable errors.

Documentation:

- Update README with accepted syntax.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Add minimal expression parser"
git push origin main
```

### Task 10.2: Add expression input UI

Files to create/update:

```text
src/ui/input/ExpressionInput.tsx
src/ui/input/ExpressionInput.test.tsx
src/App.tsx
```

Implementation:

1. Add expression text field.
2. Add sample values for variables.
3. Add compile/render button.
4. Show parser/compiler errors clearly.
5. Keep default polynomial example loaded.

Acceptance criteria:

- User can enter `a+b` and render construction.
- User can enter `a*b` and render construction.
- Invalid input shows readable error without crashing.

Documentation:

- Update README with input usage.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Add expression input UI"
git push origin main
```

### Task 10.3: Add example gallery

Files to create:

```text
src/domain/examples/gallery.ts
src/ui/examples/ExampleGallery.tsx
src/ui/examples/ExampleGallery.test.tsx
```

Examples:

- `a + b`
- `a - b`
- `a * b`
- `a / b`
- `a^2`
- `sqrt(a)`
- `(3*a + b) * (a + b)`
- `3*a^2 + 4*a*b + b^2` with simplification note

Acceptance criteria:

- Clicking an example loads expression and sample values.
- Gallery examples compile successfully.
- Documentation explains what each example demonstrates.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Add construction example gallery"
git push origin main
```

---

## Milestone 11: Rendering polish and accessibility

Goal: Make the construction readable, pleasant, and accessible.

### Task 11.1: Improve visual hierarchy

Implementation:

1. Define CSS variables for roles.
2. Distinguish inputs, unit, active construction, scaffold, intermediate, and result.
3. Make labels legible.
4. Add focus outlines for keyboard navigation.
5. Ensure final result is visually strongest.

Acceptance criteria:

- Viewer can visually distinguish result vs scaffolding.
- Labels do not dominate the diagram.
- Active step is obvious.

Documentation:

- Update `docs/RENDERING.md` with visual grammar.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Polish construction visual hierarchy"
git push origin main
```

### Task 11.2: Add scaffolding visibility controls

Controls:

- Show all scaffolding.
- Show current-step scaffolding.
- Hide retired scaffolding.

Acceptance criteria:

- Control updates SVG without recompiling expression.
- Current-step mode keeps active construction understandable.
- Final frame can show clean result.

Documentation:

- Update README or `docs/INTERACTION.md`.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Add scaffolding visibility controls"
git push origin main
```

### Task 11.3: Add keyboard and reduced-motion accessibility

Implementation:

1. Keyboard navigation between steps.
2. Keyboard selection of objects where practical.
3. Respect `prefers-reduced-motion`.
4. Ensure proof cards can be opened without hover.
5. Add ARIA labels for interactive controls.

Acceptance criteria:

- User can navigate steps with keyboard.
- Reduced-motion mode avoids scroll animation dependence.
- Proof cards work with click/tap/keyboard.

Documentation:

- Add `docs/ACCESSIBILITY.md`.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Improve accessibility and reduced-motion support"
git push origin main
```

---

## Milestone 12: Export and documentation

Goal: Make outputs reusable and project understandable.

### Task 12.1: Export construction as JSON

Implementation:

1. Add button to export construction trace as JSON.
2. Include expression, sample values, construction steps, geometry objects, reveal actions, and proofs.
3. Avoid including volatile UI state.

Tests:

- Exported JSON validates against expected shape.
- Importing/reusing exported JSON in a test can render scene.

Documentation:

- Add `docs/EXPORT_FORMAT.md`.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Add construction JSON export"
git push origin main
```

### Task 12.2: Export final SVG

Implementation:

1. Add button to export current SVG.
2. Include necessary styles inline or as embedded style element.
3. Support export of current scroll state and clean final state.

Acceptance criteria:

- Exported SVG opens in a browser.
- Clean final SVG contains result label and expression summary.

Documentation:

- Update `docs/EXPORT_FORMAT.md`.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Add SVG export"
git push origin main
```

### Task 12.3: Write user-facing documentation

Files to update/create:

```text
README.md
docs/GETTING_STARTED.md
docs/MATH_BACKGROUND.md
docs/ARCHITECTURE.md
```

Documentation must explain:

- What the app does.
- What constructible field operations are supported.
- Why unit length matters.
- Difference between symbolic construction and numeric rendering.
- How scroll-driven construction works.
- How proof cards work.
- How to run tests/build.
- How to add a new construction macro.

Commit:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
git add .
git commit -m "Document geometry computer architecture and usage"
git push origin main
```

---

## 8. Suggested Directory Structure

Target structure after the first several milestones:

```text
geometry-computer/
  README.md
  ROADMAP.md
  package.json
  tsconfig.json
  vite.config.ts
  src/
    App.tsx
    App.css
    main.tsx
    domain/
      compiler/
        compileExpression.ts
      construction/
        ConstructionContext.ts
        idAllocator.ts
        types.ts
        examples.ts
        macros/
          addition.ts
          subtraction.ts
          multiplication.ts
          division.ts
          square.ts
          squareRoot.ts
      expression/
        examples.ts
        format.ts
        normalize.ts
        simplify.ts
        types.ts
      geometry/
        coordinates.ts
        intersections.ts
        types.ts
      parser/
        parseExpression.ts
      proofs/
        arithmeticProofs.ts
      reveal/
        evaluateReveal.ts
    render/
      svg/
        SvgConstructionCanvas.tsx
        objectStyles.ts
        renderObject.tsx
    ui/
      examples/
        ExampleGallery.tsx
      expression/
        ExpressionTree.tsx
      input/
        ExpressionInput.tsx
      inspector/
        ObjectInspector.tsx
      interaction/
        interactionState.ts
      proofs/
        ProofCard.tsx
        ProofClaim.tsx
      scroll/
        ScrollConstructionLayout.tsx
        ScrollStep.tsx
        useScrollProgress.ts
      steps/
        ConstructionStepList.tsx
        OperationBadge.tsx
  docs/
    ACCESSIBILITY.md
    ARCHITECTURE.md
    CONSTRUCTION_MACROS.md
    DOMAIN_MODEL.md
    EXPORT_FORMAT.md
    EXPRESSION_COMPILER.md
    GETTING_STARTED.md
    INTERACTION.md
    MATH_BACKGROUND.md
    PROOFS.md
    RENDERING.md
    SCROLL_INTERACTION.md
```

---

## 9. Testing Strategy

### Unit tests

Prioritize pure logic:

- Expression formatting.
- Expression parsing.
- Expression normalization.
- Numeric evaluation.
- Construction macro generation.
- Geometry coordinate helpers.
- Intersection calculations.
- Reveal action evaluation.
- Interaction-state derivation.

### Component tests

Use component tests for:

- SVG renderer output.
- Step list highlighting.
- Object inspector.
- Proof card behavior.
- Expression input errors.

### End-to-end tests, later

Use Playwright for:

- Load default example.
- Scroll construction.
- Hover/click object.
- Open proof card.
- Change expression.
- Export SVG/JSON.

### Mathematical tests

For every construction macro:

- Test nominal positive inputs.
- Test zero where meaningful.
- Test negative output for subtraction.
- Test invalid denominator for division.
- Test invalid square root input.
- Test that output numeric value matches arithmetic evaluation.
- Test that every object has provenance.
- Test that every proof highlight references an existing object.

---

## 10. Mathematical Assumptions to Document

The app should explicitly document these assumptions:

1. A fixed unit segment `1` is given.
2. Multiplication of lengths is interpreted relative to the unit segment.
3. Numeric rendering uses sample values and is illustrative.
4. The construction trace is the mathematical object; the SVG is a visualization of one instance.
5. Directed lengths are allowed on the number line.
6. Division requires nonzero denominator.
7. Square root requires nonnegative radicand for real straightedge-compass length output.
8. Intersections may have multiple branches; branch choices must be represented explicitly.
9. The MVP supports field operations, plus optional square roots, not arbitrary functions.

---

## 11. Definition of Done

A task is done only when:

- Feature works in the browser if UI-facing.
- Relevant tests are added or updated.
- All test/typecheck/lint/build/format checks pass.
- Documentation is updated.
- Code is committed with a clear message.
- Commit is pushed to `main`.

A construction macro is done only when:

- It has numeric tests.
- It has geometry objects with provenance.
- It has construction steps.
- It has reveal actions.
- It has proof-card data or an explicit reason no proof is needed.
- It handles invalid/degenerate inputs explicitly.
- It renders in the app.

A UI interaction is done only when:

- It works with mouse.
- It has a click/tap equivalent if hover is involved.
- It is keyboard-accessible where practical.
- It respects reduced-motion if animation is involved.
- It has component or logic tests.

---

## 12. Recommended First Agent Prompt

Use this prompt in Codex after the repository is available:

```text
You are working in https://github.com/dnrohr/geometry-computer.

Read ROADMAP.md completely. Start with Milestone 1 only. Inspect the repository before making changes. If it is empty, bootstrap a Vite React TypeScript app. Add test, lint, format, typecheck, and build scripts. Add a README with setup instructions and a short project description. Add one smoke test. Run npm install, npm test, npm run typecheck, npm run lint, npm run build, and npm run format:check. Fix any failures. Commit the completed milestone with a clear message and push to main.

Do not begin Milestone 2 until Milestone 1 is committed and pushed.
```

---

## 13. Recommended Second Agent Prompt

After Milestone 1 is complete:

```text
Continue in https://github.com/dnrohr/geometry-computer.

Read ROADMAP.md and implement Milestone 2 only: expression model, construction trace model, and geometry object model. Keep all domain logic independent from React. Add tests and documentation exactly as requested in the roadmap. Run npm test, npm run typecheck, npm run lint, npm run build, and npm run format:check. Fix failures. Commit with a clear message and push to main.

Do not begin Milestone 3 until Milestone 2 is committed and pushed.
```

---

## 14. Future Ideas After MVP

Only consider these after the MVP is working and documented.

- More sophisticated algebraic simplification.
- Common-subexpression elimination.
- Import/export construction scripts.
- Formal construction verification.
- GeoGebra export.
- Better mobile layout.
- Timeline scrubber with play/pause.
- User-authored construction macros.
- Support for nested radicals.
- Support for exact symbolic coordinates.
- Animated branch-choice explanations.
- Side-by-side algebraic and geometric proof modes.
- Educational lesson mode.
