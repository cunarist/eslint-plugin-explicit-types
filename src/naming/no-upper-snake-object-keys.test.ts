import { describe } from "vite-plus/test";

import { spanOf, testRule } from "#testing";

import { noUpperSnakeObjectKeys } from "./no-upper-snake-object-keys.ts";

const UPPER_SNAKE_KEY = { messageId: "upperSnakeKey" };

describe("no-upper-snake-object-keys: rejects a union-keyed lookup table", () => {
  testRule("no-upper-snake-object-keys", noUpperSnakeObjectKeys, {
    valid: [],
    invalid: [
      {
        code: 'const a = { PENDING: "x", DONE: "y" };',
        errors: [UPPER_SNAKE_KEY, UPPER_SNAKE_KEY],
      },
      {
        code: "interface Labels { PENDING: string; DONE: string }",
        errors: [UPPER_SNAKE_KEY, UPPER_SNAKE_KEY],
      },
      { code: "type Labels = { IN_PROGRESS: string };", errors: [UPPER_SNAKE_KEY] },
    ],
  });
});

describe("no-upper-snake-object-keys: quoting is not an escape hatch", () => {
  testRule("no-upper-snake-object-keys", noUpperSnakeObjectKeys, {
    valid: [],
    invalid: [
      { code: 'const a = { "PENDING": 1 };', errors: [UPPER_SNAKE_KEY] },
      { code: 'interface L { "DONE": string }', errors: [UPPER_SNAKE_KEY] },
    ],
  });
});

describe("no-upper-snake-object-keys: allows ordinary keys", () => {
  testRule("no-upper-snake-object-keys", noUpperSnakeObjectKeys, {
    valid: [
      "const a = { id: 1, userId: 2, http2Push: 3 };",
      "interface Row { id: string; createdAt: number }",
    ],
    invalid: [],
  });
});

describe("no-upper-snake-object-keys: allows names someone else defined", () => {
  // The point of narrowing this rule: these are foreign vocabularies, not
  // lookup tables keyed by one of our own string unions.
  testRule("no-upper-snake-object-keys", noUpperSnakeObjectKeys, {
    valid: [
      'const m = { "cl-zip-dialog": Dialog };',
      'const a = { "data-language": lang };',
      'const k = { "Mod-z": undo, "Mod-Z": redo };',
      'const h = { "Content-Type": "json" };',
      'const h = { "x-api-key": key };',
      "const v = { TSIndexSignature: fn };",
      "const c = { ToggleBold: cmd };",
      "const p = { $anchor: a, $head: b };",
    ],
    invalid: [],
  });
});

describe("no-upper-snake-object-keys: leaves snake_case keys alone", () => {
  testRule("no-upper-snake-object-keys", noUpperSnakeObjectKeys, {
    valid: ["const a = { user_id: 1 };", 'const a = { "user_id": 1 };'],
    invalid: [],
  });
});

describe("no-upper-snake-object-keys: ignores class members", () => {
  testRule("no-upper-snake-object-keys", noUpperSnakeObjectKeys, {
    valid: ["class C { static MAX_RETRIES = 5; }"],
    invalid: [],
  });
});

describe("no-upper-snake-object-keys: ignores destructuring", () => {
  testRule("no-upper-snake-object-keys", noUpperSnakeObjectKeys, {
    valid: ["const { PENDING } = labels;"],
    invalid: [],
  });
});

describe("no-upper-snake-object-keys: ignores computed keys", () => {
  testRule("no-upper-snake-object-keys", noUpperSnakeObjectKeys, {
    valid: ["const a = { [key]: 1 };"],
    invalid: [],
  });
});

describe("no-upper-snake-object-keys: ignores numeric keys", () => {
  testRule("no-upper-snake-object-keys", noUpperSnakeObjectKeys, {
    valid: ['const a = { 0: "a", 1: "b" };'],
    invalid: [],
  });
});

describe("no-upper-snake-object-keys: checks shorthand and method shorthand", () => {
  testRule("no-upper-snake-object-keys", noUpperSnakeObjectKeys, {
    valid: [],
    invalid: [
      { code: "const a = { PENDING };", errors: [UPPER_SNAKE_KEY] },
      { code: "const a = { DO_THING() {} };", errors: [UPPER_SNAKE_KEY] },
    ],
  });
});

const highlighted = 'const a = { PENDING: "x" };';
describe("no-upper-snake-object-keys: highlights the key alone", () => {
  testRule("no-upper-snake-object-keys", noUpperSnakeObjectKeys, {
    valid: [],
    invalid: [
      {
        code: highlighted,
        errors: [
          { ...UPPER_SNAKE_KEY, data: { text: "PENDING" }, ...spanOf(highlighted, "PENDING") },
        ],
      },
    ],
  });
});
