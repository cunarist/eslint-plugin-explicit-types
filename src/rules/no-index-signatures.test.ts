import { spanOf, testRule } from "#testing";

import { noIndexSignaturesRule } from "./no-index-signatures.ts";

const INDEX_SIGNATURE = { messageId: "indexSignature" };

const highlighted = "interface A { [key: string]: number }";

testRule("no-index-signatures", noIndexSignaturesRule, {
  valid: [
    // allows concrete fields and a Map
    "interface A { host: string; token: string }",
    "const m = new Map<string, string>();",

    // ignores mapped types
    "type A = { [K in B]: string };",
  ],
  invalid: [
    // rejects the signature in each container
    { code: "interface A { [k: string]: string }", errors: [INDEX_SIGNATURE] },
    { code: "type A = { [k: string]: string };", errors: [INDEX_SIGNATURE] },
    { code: "class A { [k: string]: string; }", errors: [INDEX_SIGNATURE] },

    // rejects every key type
    { code: "interface A { [k: string]: number }", errors: [INDEX_SIGNATURE] },
    { code: "interface A { [k: number]: string }", errors: [INDEX_SIGNATURE] },
    { code: "interface A { [k: symbol]: string }", errors: [INDEX_SIGNATURE] },

    // rejects a readonly index signature once
    { code: "interface A { readonly [k: string]: string }", errors: [INDEX_SIGNATURE] },

    // highlights the signature member
    {
      code: highlighted,
      errors: [{ ...INDEX_SIGNATURE, ...spanOf(highlighted, "[key: string]: number") }],
    },
  ],
});
