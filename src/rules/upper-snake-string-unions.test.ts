import { type ExpectedError, spanOf, testRule } from "#testing";

import { upperSnakeStringUnionsRule } from "./upper-snake-string-unions.ts";

const NOT_UPPER_SNAKE = { messageId: "notUpperSnake" };

/** An error on `value`, suggesting `suggestion` and leaving `output`. */
function rewrite(value: string, suggestion: string, output: string): ExpectedError {
  return {
    ...NOT_UPPER_SNAKE,
    data: { value },
    suggestions: [{ messageId: "rewrite", data: { value, suggestion }, output }],
  };
}

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
      errors: [
        rewrite("fast", "FAST", 'interface Box { mode: "FAST" | "slow" }'),
        rewrite("slow", "SLOW", 'interface Box { mode: "fast" | "SLOW" }'),
      ],
    },
    {
      code: 'function go(mode: "fast" | "slow") {}',
      errors: [
        rewrite("fast", "FAST", 'function go(mode: "FAST" | "slow") {}'),
        rewrite("slow", "SLOW", 'function go(mode: "fast" | "SLOW") {}'),
      ],
    },
    {
      code: "let mode: 'fast' | 'slow';",
      errors: [
        rewrite("fast", "FAST", "let mode: 'FAST' | 'slow';"),
        rewrite("slow", "SLOW", "let mode: 'fast' | 'SLOW';"),
      ],
    },

    // rejects lowercase and mixed-case members
    {
      code: 'type Status = "Done" | "OPEN";',
      errors: [rewrite("Done", "DONE", 'type Status = "DONE" | "OPEN";')],
    },
    {
      code: 'type Status = "inProgress" | "OPEN";',
      errors: [rewrite("inProgress", "IN_PROGRESS", 'type Status = "IN_PROGRESS" | "OPEN";')],
    },
    {
      code: 'type Server = "HTTPServer" | "FTP_SERVER";',
      errors: [rewrite("HTTPServer", "HTTP_SERVER", 'type Server = "HTTP_SERVER" | "FTP_SERVER";')],
    },
    {
      code: 'type Status = "in-review" | "OPEN";',
      errors: [rewrite("in-review", "IN_REVIEW", 'type Status = "IN_REVIEW" | "OPEN";')],
    },

    // offers no rewrite onto a member the union already has
    {
      code: 'type Status = "pending" | "PENDING";',
      errors: [{ ...NOT_UPPER_SNAKE, suggestions: [] }],
    },

    // offers no rewrite when no UPPER_SNAKE_CASE spelling exists
    { code: 'type Rank = "1st" | "LAST";', errors: [{ ...NOT_UPPER_SNAKE, suggestions: [] }] },
    { code: 'type Mark = "*" | "PLUS";', errors: [{ ...NOT_UPPER_SNAKE, suggestions: [] }] },

    // rejects a member containing a space
    {
      code: 'type Status = "IN PROGRESS" | "DONE";',
      errors: [rewrite("IN PROGRESS", "IN_PROGRESS", 'type Status = "IN_PROGRESS" | "DONE";')],
    },

    // rejects malformed underscore segments
    {
      code: 'type Status = "_OPEN" | "DONE";',
      errors: [rewrite("_OPEN", "OPEN", 'type Status = "OPEN" | "DONE";')],
    },
    {
      code: 'type Status = "OPEN_" | "DONE";',
      errors: [rewrite("OPEN_", "OPEN", 'type Status = "OPEN" | "DONE";')],
    },
    {
      code: 'type Status = "OPEN__DONE" | "DONE";',
      errors: [rewrite("OPEN__DONE", "OPEN_DONE", 'type Status = "OPEN_DONE" | "DONE";')],
    },

    // reports once per offending member
    {
      code: 'type Status = "pending" | "done" | "OPEN";',
      errors: [
        rewrite("pending", "PENDING", 'type Status = "PENDING" | "done" | "OPEN";'),
        rewrite("done", "DONE", 'type Status = "pending" | "DONE" | "OPEN";'),
      ],
    },

    // highlights the offending literal only
    {
      code: highlighted,
      errors: [
        {
          ...rewrite(
            "in progress",
            "IN_PROGRESS",
            'type Status = "OPEN" | "IN_PROGRESS" | "DONE";',
          ),
          ...spanOf(highlighted, '"in progress"'),
        },
      ],
    },
  ],
});
