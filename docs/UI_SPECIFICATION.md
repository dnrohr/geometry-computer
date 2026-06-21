# Geometry Computer UI specification

This document is the normative behavior and appearance contract for the Geometry Computer user interface. Requirement IDs are stable and are referenced by automated tests. Unless a requirement explicitly says otherwise, it applies to pointer, touch, and keyboard users.

## 1. Product behavior

- **UI-001 — Immediate default scene.** The application opens with the polynomial product `(3*a + b) * (a + b)`, sample values `a=2`, `b=1`, `x=3`, and `y=2`, plus the display equality `3a² + 4ab + b² = (3a + b)(a + b)` and numeric result `21`.
- **UI-002 — No dead-end state.** A valid compiled scene always exposes its expression, numeric result, diagram, generated trace, expression tree, inspector, reveal control, scaffolding control, and export controls.
- **UI-003 — Failed compilation is non-destructive.** A parser or construction-domain error appears as an alert associated with the expression input. The previously valid scene remains rendered and interactive.
- **UI-004 — Deterministic recompilation.** Compiling the same expression and values produces the same object IDs, step IDs, geometry, proofs, and numeric result.

## 2. Header and page composition

- **UI-010 — Header.** The masthead contains the product name, the eyebrow “Compass · Straightedge · Algebra,” and a one-sentence description. It is informational and contains no controls.
- **UI-011 — Reading order.** Keyboard and document order is: masthead, expression form, examples, current-construction summary, construction controls, diagram and steps, expression tree, inspector, and optional proof card.
- **UI-012 — Desktop composition.** Above 760 px, the masthead and construction area use two columns. The SVG occupies the wider construction column and the trace occupies the narrower column.
- **UI-013 — Mobile composition.** At 760 px and below, all major grids become one column. The canvas remains available above the steps and must not force horizontal page scrolling.
- **UI-014 — No accidental clipping.** Text, buttons, focus rings, proof content, inspector content, and SVG labels must remain readable inside their panels. Intentional overflow is limited to the horizontally scrollable example gallery. Panels may grow vertically; content must not be hidden merely to preserve a fixed height.

## 3. Expression form

- **UI-020 — Expression field.** The “Expression” textbox accepts explicit arithmetic syntax: variables, integers, decimals, `+`, `-`, `*`, `/`, `^2`, parentheses, and `sqrt(...)`. Editing updates the draft only; it does not replace the current scene until compilation.
- **UI-021 — Sample values.** Four numeric inputs labeled `a`, `b`, `x`, and `y` accept any JavaScript number supported by an HTML `number` input with `step="any"`. Editing one input preserves the other sample values.
- **UI-022 — Compile construction button.** Clicking the button or submitting the form parses and compiles the current draft and values. Success replaces the scene, clears an existing error, resets selection to the first step, and shows the completed result. Failure follows UI-003.
- **UI-023 — Error association.** When present, the error uses `role="alert"`, has the stable ID `expression-error`, and is referenced by `aria-describedby` on the expression field.

## 4. Example gallery

- **UI-030 — Gallery contents.** The gallery exposes Addition, Subtraction, Multiplication, Division, Square, Square root, Polynomial product, and Expanded polynomial examples. Every button shows a name, source expression, and short method note.
- **UI-031 — Example selection.** Clicking an example atomically replaces the draft expression, sample values, compiled scene, displayed equality, numeric result, diagram, steps, proofs, and expression tree.
- **UI-032 — Gallery overflow.** On narrow widths, examples stay as readable cards in a horizontal scroller rather than being clipped or compressed below their usable width.

## 5. Current-construction summary

- **UI-040 — Symbolic summary.** The summary identifies the scene and displays original and simplified/compiled expressions. When they differ, the simplified expression is visually emphasized.
- **UI-041 — Numeric result.** The illustrative numeric result is displayed to at most five decimal places. It is not presented as a replacement for the symbolic construction.

## 6. Construction controls

- **UI-050 — Reveal slider.** The range input is labeled “Reveal progress,” spans `0` through `1` in increments of `0.01`, and directly updates object visibility and draw progress without recompiling.
- **UI-051 — Scroll synchronization.** Scrolling through the generated trace updates reveal progress and the active step. The canvas remains sticky while its trace is being traversed.
- **UI-052 — Scaffolding select.** The select has exactly three modes: “Show all,” “Current step,” and “Hide retired.” The default is “Current step.” Changing mode only changes rendering visibility.
- **UI-053 — Show all.** Every scaffold whose reveal state permits visibility is rendered.
- **UI-054 — Current step.** Only scaffolds created by the active step are rendered; non-scaffold geometry is unaffected.
- **UI-055 — Hide retired.** All scaffold geometry is hidden; inputs, intermediates, active construction objects, labels, and results remain governed by reveal state.
- **UI-056 — Export JSON button.** Downloads `construction.json` with version, expressions, values, viewBox, objects, steps, reveal actions, and proofs, excluding volatile UI state.
- **UI-057 — Export current SVG button.** Downloads `construction.svg` containing the current reveal/scaffolding state, accessible title/description, and embedded visual-role styles.
- **UI-058 — Export clean SVG button.** Downloads `construction-final.svg`; scaffold and ghost objects are hidden, result visibility is restored, and the algebraic expression summary is embedded.

## 7. Diagram

- **UI-060 — Accessible SVG.** The SVG has image semantics, a title, a description, a stable viewBox, and an expression metadata attribute.
- **UI-061 — Object identity.** Every rendered geometry object has a stable DOM ID, `data-object-id`, creating-step reference, semantic role class, and provenance-backed accessible name when interactive.
- **UI-062 — Reveal rendering.** Hidden objects have zero opacity. Partial draw actions use dash attributes. Dimmed objects use reduced opacity. Completed objects render fully.
- **UI-063 — Object pointer behavior.** Hovering an object highlights it and its creating/consuming steps. Leaving removes transient hover state.
- **UI-064 — Object activation.** Clicking an object selects it and opens the inspector. Enter and Space perform the same activation on focused geometry.
- **UI-065 — Highlight appearance.** Highlighted objects override ordinary opacity, use the brightest stroke, increase stroke width, and receive a restrained glow.

### Geometry visual grammar

- **UI-066 — Inputs.** Given lengths use a cool blue stroke.
- **UI-067 — Unit.** Unit geometry uses a neutral light stroke distinct from variable inputs.
- **UI-068 — Scaffolding.** Auxiliary geometry is thinner, muted, and dashed.
- **UI-069 — Intermediate values.** Intermediate constructed values use violet with a stronger stroke than scaffolding.
- **UI-070 — Active/proof geometry.** Active construction and proof-highlight objects use warm pale gold.
- **UI-071 — Result.** Final result geometry is the strongest visual element, using the accent gold and the largest normal stroke width.
- **UI-072 — Labels.** Labels use a compact monospace face, stay subordinate to geometry, and use the corresponding semantic role color.
- **UI-073 — Scale and fit.** The complete viewBox must fit within the SVG viewport without cropping geometry. For long constructions, geometric rows may become visually smaller; the UI must preserve labels and offer simpler gallery examples for focused inspection.

## 8. Generated trace

- **UI-080 — Step list.** Every macro and primitive step has a button containing its title and summary. Macro steps additionally show an operation badge.
- **UI-081 — Step activation.** Clicking a step makes it active, selects it for highlighting, and advances reveal progress to the end of that step’s interval.
- **UI-082 — Step hover.** Hovering a step transiently highlights all input, output, and created geometry. Leaving clears only transient step hover.
- **UI-083 — Keyboard traversal.** `Alt+ArrowDown` moves one step forward and `Alt+ArrowUp` moves one step backward. Traversal clamps at the first and last steps.
- **UI-084 — Active appearance.** The active/highlighted step uses an accent left border and tinted background without clipping its button, badge, or focus outline.
- **UI-085 — Operation badge.** A macro badge shows operation kind, input IDs (or “given”), output IDs, and geometric method.
- **UI-086 — Why button.** A macro with a proof has a “Why?” button. It opens the matching proof card. Primitive steps and operations without proofs do not show it.

## 9. Expression tree

- **UI-090 — Tree structure.** The panel renders the recursive compiled expression with one button per node and nested lists for operands.
- **UI-091 — Equality context.** The panel repeats original and simplified expressions when supplied and uses an arrow only when they differ.
- **UI-092 — Active expression.** The expression represented by the active macro, or by the parent macro of an active primitive, receives the active visual treatment.
- **UI-093 — Node activation.** Clicking a node selects all geometry that represents that exact formatted subexpression, highlights producing/consuming steps, and opens the first matching object in the inspector.

## 10. Object inspector

- **UI-100 — Empty state.** With no object selected, the inspector asks the user to select diagram geometry.
- **UI-101 — Object details.** A selected object displays label/fallback identity, kind, role, creating step, dependencies, consuming steps, and represented expression. Empty relationships use readable fallback text.
- **UI-102 — Close inspector button.** The accessible “Close inspector” button clears object selection and restores the empty state without changing the construction.
- **UI-103 — Live updates.** The inspector is an `aria-live="polite"` region so selection changes are announced without interrupting the user.

## 11. Proof card

- **UI-110 — Proof content.** A proof card shows title, intuition, givens, optional assumptions, claims, optional math, and conclusion.
- **UI-111 — Claim hover/focus.** Hovering or focusing a claim highlights all linked diagram objects. Leaving or blurring clears a transient highlight.
- **UI-112 — Claim selection.** Clicking/tapping a claim toggles a persistent highlight and communicates state through `aria-pressed`.
- **UI-113 — Close proof button.** The accessible “Close proof” button closes the card and leaves the construction intact.

## 12. Accessibility and motion

- **UI-120 — Native controls.** Text fields, number fields, range, select, and ordinary actions use native HTML controls.
- **UI-121 — Focus visibility.** Buttons, inputs, selects, and interactive SVG objects receive a clearly visible accent focus outline with offset.
- **UI-122 — Non-hover equivalents.** Every hover-driven feature has click, focus, keyboard, or persistent-selection behavior.
- **UI-123 — Reduced motion.** Under `prefers-reduced-motion: reduce`, animation and smooth scrolling are disabled and construction progress initializes complete.
- **UI-124 — Color independence.** Role and state are communicated with labels, line width, dash patterns, borders, text, and ARIA state in addition to color.

## 13. Test mapping

Automated tests are organized by contract surface:

- `App.test.tsx`: UI-001–004, UI-010–011, UI-022, UI-030–031, UI-040–041, UI-050–052, UI-056–058, UI-080–086, UI-093, UI-102, UI-113.
- `ExpressionInput.test.tsx`: UI-020–023, UI-120.
- `ExampleGallery.test.tsx`: UI-030–031.
- `SvgConstructionCanvas.test.tsx`: UI-053–055, UI-060–065.
- `OperationBadge.test.tsx`: UI-085–086.
- `ExpressionTree.test.tsx`: UI-090–093.
- `ObjectInspector.test.tsx`: UI-100–103.
- `ProofCard.test.tsx`: UI-110–113.
- `useScrollProgress.test.ts`: UI-050–051, UI-083, UI-123.
- `exportConstruction.test.tsx`: UI-056–058.
- `uiVisualContract.test.ts`: UI-012–014, UI-032, UI-065–073, UI-084, UI-121, UI-123–124.

CSS tests verify durable selectors and declarations, not browser layout geometry. Final clipping and responsive fit must also be checked visually at desktop and mobile widths because jsdom does not perform layout.
