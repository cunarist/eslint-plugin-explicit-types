import { spanOf, testRule } from "#testing";

import { noMappedTypesRule } from "./no-mapped-types.ts";

const MAPPED = { messageId: "mappedType" };

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

    // highlights the whole construct
    {
      code: highlighted,
      errors: [{ ...MAPPED, ...spanOf(highlighted, "{ [K in B]: boolean }") }],
    },
  ],
});
