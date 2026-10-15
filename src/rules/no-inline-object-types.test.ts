import { spanOf, testRule } from "#testing";

import { noInlineObjectTypesRule } from "./no-inline-object-types.ts";

const INLINE = { messageId: "inlineObjectType" };

const highlighted = "function f(state: { a: string }): void {}";

testRule("no-inline-object-types", noInlineObjectTypesRule, {
  valid: [
    // allows a named interface
    "interface Row { id: string }",
    "function f(row: Row): void {}",
    "type Alias = Row;",
    "type Union = string | number;",

    // ignores object values
    "const a = { x: 1 };",
    "run({ x: 1 });",
  ],
  invalid: [
    // rejects an inline parameter type

    // rejects an inline return type
    { code: "function f(): { ok: boolean } { return { ok: true }; }", errors: [INLINE] },

    // rejects a type alias to an object shape
    { code: "type A = { a: string };", errors: [INLINE] },
    { code: "type Empty = {};", errors: [INLINE] },

    // rejects a nested shape
    { code: "interface I { nested: { deep: string } }", errors: [INLINE] },

    // rejects a generic constraint
    { code: "function h<T extends { id: string }>(x: T): void {}", errors: [INLINE] },

    // reports each variant of a discriminated union
    {
      code: 'type Msg = { kind: "A"; a: string } | { kind: "B"; b: number };',
      errors: [INLINE, INLINE],
    },

    // highlights the whole shape
    { code: highlighted, errors: [{ ...INLINE, ...spanOf(highlighted, "{ a: string }") }] },
  ],
});
