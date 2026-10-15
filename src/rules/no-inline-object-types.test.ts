import { describe } from "vite-plus/test";

import { spanOf, testRule } from "#testing";

import { noInlineObjectTypesRule } from "./no-inline-object-types.ts";

const INLINE = { messageId: "inlineObjectType" };

describe("no-inline-object-types: allows a named interface", () => {
  testRule("no-inline-object-types", noInlineObjectTypesRule, {
    valid: [
      "interface Row { id: string }",
      "function f(row: Row): void {}",
      "type Alias = Row;",
      "type Union = string | number;",
    ],
    invalid: [],
  });
});

describe("no-inline-object-types: rejects an inline parameter type", () => {
  testRule("no-inline-object-types", noInlineObjectTypesRule, {
    valid: [],
    invalid: [{ code: "function f(state: { a: string }): void {}", errors: [INLINE] }],
  });
});

describe("no-inline-object-types: rejects an inline return type", () => {
  testRule("no-inline-object-types", noInlineObjectTypesRule, {
    valid: [],
    invalid: [{ code: "function f(): { ok: boolean } { return { ok: true }; }", errors: [INLINE] }],
  });
});

describe("no-inline-object-types: rejects a type alias to an object shape", () => {
  testRule("no-inline-object-types", noInlineObjectTypesRule, {
    valid: [],
    invalid: [
      { code: "type A = { a: string };", errors: [INLINE] },
      { code: "type Empty = {};", errors: [INLINE] },
    ],
  });
});

describe("no-inline-object-types: rejects a nested shape", () => {
  testRule("no-inline-object-types", noInlineObjectTypesRule, {
    valid: [],
    invalid: [{ code: "interface I { nested: { deep: string } }", errors: [INLINE] }],
  });
});

describe("no-inline-object-types: rejects a generic constraint", () => {
  testRule("no-inline-object-types", noInlineObjectTypesRule, {
    valid: [],
    invalid: [{ code: "function h<T extends { id: string }>(x: T): void {}", errors: [INLINE] }],
  });
});

describe("no-inline-object-types: reports each variant of a discriminated union", () => {
  testRule("no-inline-object-types", noInlineObjectTypesRule, {
    valid: [],
    invalid: [
      {
        code: 'type Msg = { kind: "A"; a: string } | { kind: "B"; b: number };',
        errors: [INLINE, INLINE],
      },
    ],
  });
});

describe("no-inline-object-types: ignores object values", () => {
  testRule("no-inline-object-types", noInlineObjectTypesRule, {
    valid: ["const a = { x: 1 };", "run({ x: 1 });"],
    invalid: [],
  });
});

const highlighted = "function f(state: { a: string }): void {}";
describe("no-inline-object-types: highlights the whole shape", () => {
  testRule("no-inline-object-types", noInlineObjectTypesRule, {
    valid: [],
    invalid: [
      { code: highlighted, errors: [{ ...INLINE, ...spanOf(highlighted, "{ a: string }") }] },
    ],
  });
});
