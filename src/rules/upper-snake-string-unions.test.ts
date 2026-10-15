import { spanOf, testRule } from "#testing";

import { upperSnakeStringUnionsRule } from "./upper-snake-string-unions.ts";

const NOT_UPPER_SNAKE = { messageId: "notUpperSnake" };

const highlighted = 'type Status = "OPEN" | "in progress" | "DONE";';

testRule("upper-snake-string-unions", upperSnakeStringUnionsRule, {
  valid: [
    // allows UPPER_SNAKE_CASE members
    'type Status = "PENDING" | "IN_PROGRESS" | "DONE";',
    'type Mode = "FAST";',

    // allows digits inside a segment
    'type Protocol = "HTTP2" | "LEVEL_3" | "H2C";',

    // ignores non-string union members
    'type Id = "USER_ID" | number;',
    "type Maybe = string | null;",
    "type Union = Foo | Bar;",
    'type Mixed = "OPEN" | 42 | { id: string };',

    // checks unions outside a type alias
    // A union written inline on an interface member is the same enumeration as
    // one behind an alias, so it is held to the same casing.
    'interface Box { mode: "FAST" | "SLOW" }',
  ],
  invalid: [
    // checks unions outside a type alias
    // A union written inline on an interface member is the same enumeration as
    // one behind an alias, so it is held to the same casing.
    {
      code: 'interface Box { mode: "fast" | "slow" }',
      errors: [NOT_UPPER_SNAKE, NOT_UPPER_SNAKE],
    },
    { code: 'function go(mode: "fast" | "slow") {}', errors: [NOT_UPPER_SNAKE, NOT_UPPER_SNAKE] },
    { code: 'const mode: "fast" | "slow" = "fast";', errors: [NOT_UPPER_SNAKE, NOT_UPPER_SNAKE] },

    // rejects lowercase and mixed-case members
    { code: 'type Status = "pending" | "PENDING";', errors: [NOT_UPPER_SNAKE] },
    { code: 'type Status = "Done" | "OPEN";', errors: [NOT_UPPER_SNAKE] },
    { code: 'type Status = "inProgress" | "OPEN";', errors: [NOT_UPPER_SNAKE] },

    // rejects a member containing a space
    { code: 'type Status = "IN PROGRESS" | "DONE";', errors: [NOT_UPPER_SNAKE] },

    // rejects malformed underscore segments
    { code: 'type Status = "_OPEN" | "DONE";', errors: [NOT_UPPER_SNAKE] },
    { code: 'type Status = "OPEN_" | "DONE";', errors: [NOT_UPPER_SNAKE] },
    { code: 'type Status = "OPEN__DONE" | "DONE";', errors: [NOT_UPPER_SNAKE] },

    // reports once per offending member
    {
      code: 'type Status = "pending" | "done" | "OPEN";',
      errors: [NOT_UPPER_SNAKE, NOT_UPPER_SNAKE],
    },

    // highlights the offending literal only
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
