import { spanOf, testRule } from "#testing";

import { noUpperSnakeObjectKeysRule } from "./no-upper-snake-object-keys.ts";

const UPPER_SNAKE_KEY = { messageId: "upperSnakeKey" };

const highlighted = 'const a = { PENDING: "x" };';

testRule("no-upper-snake-object-keys", noUpperSnakeObjectKeysRule, {
  valid: [
    // allows ordinary keys
    "const a = { id: 1, userId: 2, http2Push: 3 };",
    "interface Row { id: string; createdAt: number }",

    // allows names someone else defined
    // The point of narrowing this rule: these are foreign vocabularies, not
    // lookup tables keyed by one of our own string unions.
    'const m = { "cl-zip-dialog": Dialog };',
    'const a = { "data-language": lang };',
    'const k = { "Mod-z": undo, "Mod-Z": redo };',
    'const h = { "Content-Type": "json" };',
    'const h = { "x-api-key": key };',
    "const v = { TSIndexSignature: fn };",
    "const c = { ToggleBold: cmd };",
    "const p = { $anchor: a, $head: b };",

    // leaves snake_case keys alone
    "const a = { user_id: 1 };",
    'const a = { "user_id": 1 };',

    // ignores class members
    "class C { static MAX_RETRIES = 5; }",

    // ignores destructuring
    "const { PENDING } = labels;",

    // ignores computed keys
    "const a = { [key]: 1 };",

    // ignores numeric keys
    'const a = { 0: "a", 1: "b" };',
  ],
  invalid: [
    // rejects a union-keyed lookup table
    {
      code: 'const a = { PENDING: "x", DONE: "y" };',
      errors: [UPPER_SNAKE_KEY, UPPER_SNAKE_KEY],
    },
    {
      code: "interface Labels { PENDING: string; DONE: string }",
      errors: [UPPER_SNAKE_KEY, UPPER_SNAKE_KEY],
    },
    { code: "type Labels = { IN_PROGRESS: string };", errors: [UPPER_SNAKE_KEY] },

    // quoting is not an escape hatch
    { code: 'const a = { "PENDING": 1 };', errors: [UPPER_SNAKE_KEY] },
    { code: 'interface L { "DONE": string }', errors: [UPPER_SNAKE_KEY] },

    // checks shorthand and method shorthand
    { code: "const a = { PENDING };", errors: [UPPER_SNAKE_KEY] },
    { code: "const a = { DO_THING() {} };", errors: [UPPER_SNAKE_KEY] },

    // highlights the key alone
    {
      code: highlighted,
      errors: [
        { ...UPPER_SNAKE_KEY, data: { text: "PENDING" }, ...spanOf(highlighted, "PENDING") },
      ],
    },
  ],
});
