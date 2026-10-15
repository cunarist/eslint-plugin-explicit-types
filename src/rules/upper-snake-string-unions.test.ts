import { describe } from "vite-plus/test";

import { spanOf, testRule } from "#testing";

import { upperSnakeStringUnionsRule } from "./upper-snake-string-unions.ts";

const NOT_UPPER_SNAKE = { messageId: "notUpperSnake" };

describe("upper-snake-string-unions: allows UPPER_SNAKE_CASE members", () => {
  testRule("upper-snake-string-unions", upperSnakeStringUnionsRule, {
    valid: ['type Status = "PENDING" | "IN_PROGRESS" | "DONE";', 'type Mode = "FAST";'],
    invalid: [],
  });
});

describe("upper-snake-string-unions: allows digits inside a segment", () => {
  testRule("upper-snake-string-unions", upperSnakeStringUnionsRule, {
    valid: ['type Protocol = "HTTP2" | "LEVEL_3" | "H2C";'],
    invalid: [],
  });
});

describe("upper-snake-string-unions: ignores non-string union members", () => {
  testRule("upper-snake-string-unions", upperSnakeStringUnionsRule, {
    valid: [
      'type Id = "USER_ID" | number;',
      "type Maybe = string | null;",
      "type Union = Foo | Bar;",
      'type Mixed = "OPEN" | 42 | { id: string };',
    ],
    invalid: [],
  });
});

describe("upper-snake-string-unions: checks unions outside a type alias", () => {
  // A union written inline on an interface member is the same enumeration as
  // one behind an alias, so it is held to the same casing.
  testRule("upper-snake-string-unions", upperSnakeStringUnionsRule, {
    valid: ['interface Box { mode: "FAST" | "SLOW" }'],
    invalid: [
      {
        code: 'interface Box { mode: "fast" | "slow" }',
        errors: [NOT_UPPER_SNAKE, NOT_UPPER_SNAKE],
      },
      { code: 'function go(mode: "fast" | "slow") {}', errors: [NOT_UPPER_SNAKE, NOT_UPPER_SNAKE] },
      { code: 'const mode: "fast" | "slow" = "fast";', errors: [NOT_UPPER_SNAKE, NOT_UPPER_SNAKE] },
    ],
  });
});

describe("upper-snake-string-unions: rejects lowercase and mixed-case members", () => {
  testRule("upper-snake-string-unions", upperSnakeStringUnionsRule, {
    valid: [],
    invalid: [
      { code: 'type Status = "pending" | "PENDING";', errors: [NOT_UPPER_SNAKE] },
      { code: 'type Status = "Done" | "OPEN";', errors: [NOT_UPPER_SNAKE] },
      { code: 'type Status = "inProgress" | "OPEN";', errors: [NOT_UPPER_SNAKE] },
    ],
  });
});

describe("upper-snake-string-unions: rejects a member containing a space", () => {
  testRule("upper-snake-string-unions", upperSnakeStringUnionsRule, {
    valid: [],
    invalid: [{ code: 'type Status = "IN PROGRESS" | "DONE";', errors: [NOT_UPPER_SNAKE] }],
  });
});

describe("upper-snake-string-unions: rejects malformed underscore segments", () => {
  testRule("upper-snake-string-unions", upperSnakeStringUnionsRule, {
    valid: [],
    invalid: [
      { code: 'type Status = "_OPEN" | "DONE";', errors: [NOT_UPPER_SNAKE] },
      { code: 'type Status = "OPEN_" | "DONE";', errors: [NOT_UPPER_SNAKE] },
      { code: 'type Status = "OPEN__DONE" | "DONE";', errors: [NOT_UPPER_SNAKE] },
    ],
  });
});

describe("upper-snake-string-unions: reports once per offending member", () => {
  testRule("upper-snake-string-unions", upperSnakeStringUnionsRule, {
    valid: [],
    invalid: [
      {
        code: 'type Status = "pending" | "done" | "OPEN";',
        errors: [NOT_UPPER_SNAKE, NOT_UPPER_SNAKE],
      },
    ],
  });
});

const highlighted = 'type Status = "OPEN" | "in progress" | "DONE";';
describe("upper-snake-string-unions: highlights the offending literal only", () => {
  testRule("upper-snake-string-unions", upperSnakeStringUnionsRule, {
    valid: [],
    invalid: [
      {
        code: highlighted,
        errors: [
          {
            ...NOT_UPPER_SNAKE,
            data: { value: "in progress" },
            ...spanOf(highlighted, '"in progress"'),
          },
        ],
      },
    ],
  });
});
