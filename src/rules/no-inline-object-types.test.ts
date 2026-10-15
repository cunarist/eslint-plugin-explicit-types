import { spanOf, testRule } from "#testing";

import { noInlineObjectTypesRule } from "./no-inline-object-types.ts";

const INLINE = { messageId: "inlineObjectType" };

/** The expected error when the shape is a whole alias, suggesting `output`. */
function convertible(output: string): object {
  return { ...INLINE, suggestions: [{ messageId: "convertToInterface", output }] };
}

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

    // rejects a type alias to an object shape, suggesting an interface
    { code: "type A = { a: string };", errors: [convertible("interface A { a: string }")] },
    {
      code: "export type Box<T extends string> = { value: T }",
      errors: [convertible("export interface Box<T extends string> { value: T }")],
    },
    {
      code: "declare type D = {\n  a: string;\n};",
      errors: [convertible("declare interface D {\n  a: string;\n}")],
    },

    // offers no interface for an empty shape
    { code: "type Empty = {};", errors: [{ ...INLINE, suggestions: [] }] },

    // offers no interface for a shape inside a larger alias
    { code: "type L = { a: string }[];", errors: [{ ...INLINE, suggestions: [] }] },

    // rejects a nested shape
    { code: "interface I { nested: { deep: string } }", errors: [INLINE] },

    // rejects a generic constraint
    { code: "function h<T extends { id: string }>(x: T): void {}", errors: [INLINE] },

    // reports each variant of a discriminated union
    {
      code: 'type Msg = { kind: "A"; a: string } | { kind: "B"; b: number };',
      errors: [
        { ...INLINE, suggestions: [] },
        { ...INLINE, suggestions: [] },
      ],
    },

    // highlights the whole shape
    { code: highlighted, errors: [{ ...INLINE, ...spanOf(highlighted, "{ a: string }") }] },
  ],
});
