import { spanOf, testRule } from "#testing";

import { noMappedTypesRule } from "./no-mapped-types.ts";

const MAPPED = { messageId: "mappedType" };
const WRITE = { messageId: "writeInterface" };

const highlighted = "type A = { [K in B]: boolean };";

testRule("no-mapped-types", noMappedTypesRule, {
  valid: [
    // allows concrete fields and a Map
    "interface A { darkMode: boolean }",
    "type A = { darkMode: boolean };",
    "const m = new Map<string, boolean>();",

    // ignores index signatures
    "interface A { [k: string]: number }",
  ],
  invalid: [
    // rejects a plain mapped type

    // rejects every modifier variant
    { code: "type A = { [K in B]?: boolean };", errors: [MAPPED] },
    { code: "type A = { [K in B]-?: boolean };", errors: [MAPPED] },
    { code: "type A = { readonly [K in B]: boolean };", errors: [MAPPED] },
    { code: "type A = { -readonly [K in B]: boolean };", errors: [MAPPED] },

    // rejects a renaming as clause
    { code: "type A = { [K in B as `on${K}`]: boolean };", errors: [MAPPED] },

    // fires once per mapped type
    { code: "type A = { [K in B]: { [J in C]: boolean } };", errors: [MAPPED, MAPPED] },

    // suggests an interface listing each literal key
    {
      code: 'type Flags = { [K in "darkMode" | "compact"]: boolean };',
      errors: [
        {
          ...MAPPED,
          suggestions: [
            { ...WRITE, output: "interface Flags { darkMode: boolean; compact: boolean }" },
          ],
        },
      ],
    },
    {
      code: 'export type Flags<T> = { readonly [K in "darkMode"]?: T };',
      errors: [
        {
          ...MAPPED,
          suggestions: [
            { ...WRITE, output: "export interface Flags<T> { readonly darkMode?: T }" },
          ],
        },
      ],
    },
    {
      code: 'type A = { -readonly [K in "a-b" | 1 | "a-b"]-?: string };',
      errors: [
        {
          ...MAPPED,
          suggestions: [{ ...WRITE, output: 'interface A { "a-b": string; 1: string }' }],
        },
      ],
    },

    // offers nothing when the fields cannot be listed safely
    { code: 'let a: { [K in "darkMode"]: boolean };', errors: [MAPPED] },
    { code: 'type A = { [K in "darkMode"]: K };', errors: [MAPPED] },
    { code: 'type A = { [$K in "darkMode"]: Box<$K> };', errors: [MAPPED] },
    { code: 'type A = { [K in "darkMode"] };', errors: [MAPPED] },
    { code: 'type A = { [K in "darkMode" as `on${K}`]: boolean };', errors: [MAPPED] },
    { code: 'type A = { [K in "DARK_MODE"]: boolean };', errors: [MAPPED] },
    { code: 'type A = { [K in "darkMode"]?: string | null };', errors: [MAPPED] },
    { code: 'type A = { [K in "darkMode"]: /* on */ boolean };', errors: [MAPPED] },

    // highlights the whole construct
    {
      code: highlighted,
      errors: [{ ...MAPPED, ...spanOf(highlighted, "{ [K in B]: boolean }") }],
    },
  ],
});
