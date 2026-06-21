# Geometry Computer

Geometry Computer is a React application for turning algebraic expressions in constructible lengths into readable compass-and-straightedge construction narratives. Milestone 2 adds the expression engine and an interactive workbench that exposes its operation plan.

## Expression language

The workbench accepts non-negative decimal constants, parentheses, the four arithmetic operators, and square roots written as `sqrt(expression)`. Standard precedence applies, so multiplication and division bind before addition and subtraction.

Examples:

```text
sqrt(2)
(1 + sqrt(5)) / 2
sqrt(3 + sqrt(2))
```

The engine rejects malformed input, division by zero, negative square roots, and non-finite results. Subtraction may produce a negative intermediate value, but such a value cannot be passed to `sqrt` because it does not represent a real length.

The parser, evaluator, and dependency-order descriptions live in `src/domain/expression.ts`. This domain module is independent of React so later milestones can map the same expression tree to geometric construction primitives.

## Requirements

- Node.js 22 or newer
- npm 10 or newer

## Setup

```bash
npm install
npm run dev
```

Vite will print the local development URL after the server starts.

## Verification

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
```

Run `npm run format` to apply Prettier formatting.
