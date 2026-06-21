export type Expression =
  | { type: "constant"; value: number }
  | {
      type: "binary";
      operator: "+" | "-" | "*" | "/";
      left: Expression;
      right: Expression;
    }
  | { type: "sqrt"; radicand: Expression };

type Token =
  | { type: "number"; value: number; position: number }
  | {
      type: "symbol";
      value: "+" | "-" | "*" | "/" | "(" | ")";
      position: number;
    }
  | { type: "sqrt"; position: number }
  | { type: "end"; position: number };

export class ExpressionError extends Error {
  constructor(
    message: string,
    public readonly position?: number,
  ) {
    super(
      position === undefined
        ? message
        : `${message} at character ${position + 1}`,
    );
    this.name = "ExpressionError";
  }
}

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let position = 0;

  while (position < source.length) {
    const character = source[position];

    if (/\s/.test(character)) {
      position += 1;
      continue;
    }

    if (/[0-9.]/.test(character)) {
      const start = position;
      const match = source.slice(position).match(/^(?:\d+(?:\.\d*)?|\.\d+)/);
      if (!match) {
        throw new ExpressionError("Invalid number", start);
      }

      const value = Number(match[0]);
      if (!Number.isFinite(value)) {
        throw new ExpressionError("Number is too large", start);
      }

      tokens.push({ type: "number", value, position: start });
      position += match[0].length;
      continue;
    }

    if (source.startsWith("sqrt", position)) {
      tokens.push({ type: "sqrt", position });
      position += 4;
      continue;
    }

    if (["+", "-", "*", "/", "(", ")"].includes(character)) {
      tokens.push({
        type: "symbol",
        value: character as Extract<Token, { type: "symbol" }>["value"],
        position,
      });
      position += 1;
      continue;
    }

    throw new ExpressionError(`Unexpected '${character}'`, position);
  }

  tokens.push({ type: "end", position: source.length });
  return tokens;
}

class Parser {
  private index = 0;

  constructor(private readonly tokens: Token[]) {}

  parse(): Expression {
    if (this.tokens.length === 1) {
      throw new ExpressionError("Enter an expression", 0);
    }

    const expression = this.parseAdditive();
    const remainder = this.tokens[this.index];
    if (remainder.type !== "end") {
      throw new ExpressionError("Unexpected token", remainder.position);
    }
    return expression;
  }

  private get current(): Token {
    return this.tokens[this.index];
  }

  private consume(): Token {
    const token = this.current;
    this.index += 1;
    return token;
  }

  private takeSymbol(
    value: Extract<Token, { type: "symbol" }>["value"],
  ): boolean {
    if (this.current.type === "symbol" && this.current.value === value) {
      this.consume();
      return true;
    }
    return false;
  }

  private parseAdditive(): Expression {
    let left = this.parseMultiplicative();

    while (
      this.current.type === "symbol" &&
      (this.current.value === "+" || this.current.value === "-")
    ) {
      const operator = this.consume() as Extract<Token, { type: "symbol" }>;
      const right = this.parseMultiplicative();
      left = {
        type: "binary",
        operator: operator.value as "+" | "-",
        left,
        right,
      };
    }

    return left;
  }

  private parseMultiplicative(): Expression {
    let left = this.parsePrimary();

    while (
      this.current.type === "symbol" &&
      (this.current.value === "*" || this.current.value === "/")
    ) {
      const operator = this.consume() as Extract<Token, { type: "symbol" }>;
      const right = this.parsePrimary();
      left = {
        type: "binary",
        operator: operator.value as "*" | "/",
        left,
        right,
      };
    }

    return left;
  }

  private parsePrimary(): Expression {
    const token = this.current;

    if (token.type === "number") {
      this.consume();
      return { type: "constant", value: token.value };
    }

    if (token.type === "sqrt") {
      this.consume();
      if (!this.takeSymbol("(")) {
        throw new ExpressionError(
          "Expected '(' after sqrt",
          this.current.position,
        );
      }
      const radicand = this.parseAdditive();
      if (!this.takeSymbol(")")) {
        throw new ExpressionError("Expected ')'", this.current.position);
      }
      return { type: "sqrt", radicand };
    }

    if (this.takeSymbol("(")) {
      const expression = this.parseAdditive();
      if (!this.takeSymbol(")")) {
        throw new ExpressionError("Expected ')'", this.current.position);
      }
      return expression;
    }

    throw new ExpressionError(
      "Expected a number, sqrt, or '('",
      token.position,
    );
  }
}

export function parseExpression(source: string): Expression {
  return new Parser(tokenize(source)).parse();
}

export function evaluateExpression(expression: Expression): number {
  if (expression.type === "constant") {
    return expression.value;
  }

  if (expression.type === "sqrt") {
    const radicand = evaluateExpression(expression.radicand);
    if (radicand < 0) {
      throw new ExpressionError("Square root requires a non-negative length");
    }
    return Math.sqrt(radicand);
  }

  const left = evaluateExpression(expression.left);
  const right = evaluateExpression(expression.right);
  let result: number;

  switch (expression.operator) {
    case "+":
      result = left + right;
      break;
    case "-":
      result = left - right;
      break;
    case "*":
      result = left * right;
      break;
    case "/":
      if (right === 0) {
        throw new ExpressionError("Division by zero is not constructible");
      }
      result = left / right;
      break;
  }

  if (!Number.isFinite(result)) {
    throw new ExpressionError(
      "Expression result is outside the supported range",
    );
  }
  return result;
}

const operatorLabels = {
  "+": "Add",
  "-": "Subtract",
  "*": "Multiply",
  "/": "Divide",
} as const;

export type ConstructionStep = {
  id: string;
  operation: "add" | "subtract" | "multiply" | "divide" | "sqrt";
  operands: Array<{ reference: string; value: number }>;
  value: number;
  description: string;
};

const operationNames = {
  "+": "add",
  "-": "subtract",
  "*": "multiply",
  "/": "divide",
} as const;

export function buildConstructionPlan(
  expression: Expression,
): ConstructionStep[] {
  const steps: ConstructionStep[] = [];

  function visit(node: Expression): { reference: string; value: number } {
    if (node.type === "constant") {
      return { reference: String(node.value), value: node.value };
    }

    if (node.type === "sqrt") {
      const operand = visit(node.radicand);
      const value = evaluateExpression(node);
      const id = `L${steps.length + 1}`;
      steps.push({
        id,
        operation: "sqrt",
        operands: [operand],
        value,
        description: `Take the square root of ${operand.reference}`,
      });
      return { reference: id, value };
    }

    const left = visit(node.left);
    const right = visit(node.right);
    const value = evaluateExpression(node);
    const id = `L${steps.length + 1}`;
    steps.push({
      id,
      operation: operationNames[node.operator],
      operands: [left, right],
      value,
      description: `${operatorLabels[node.operator]} ${left.reference} and ${right.reference}`,
    });
    return { reference: id, value };
  }

  visit(expression);
  return steps;
}

export function describeExpression(expression: Expression): string[] {
  return buildConstructionPlan(expression).map(
    ({ id, description }) => `${id}: ${description}`,
  );
}
