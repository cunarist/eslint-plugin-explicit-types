import { spanOf, testRule } from "#testing";

import { noConditionalTypesRule } from "./no-conditional-types.ts";

const CONDITIONAL = { messageId: "conditional" };
const INFER = { messageId: "infer" };

const conditionalCode = "type Flag<T> = T extends string ? 1 : 2;";

const inferCode = "type U<T> = T extends Array<infer E> ? E : never;";

testRule("no-conditional-types", noConditionalTypesRule, {
  valid: [
    // allows a plain type alias
    "type Items = TaskSnapshot;",
    "type Wrapper<T> = { value: T };",
    "type Union = string | number;",
  ],
  invalid: [
    // rejects a conditional type, highlighting the whole of it
    {
      code: conditionalCode,
      errors: [{ ...CONDITIONAL, ...spanOf(conditionalCode, "T extends string ? 1 : 2") }],
    },

    // reports the conditional and the infer apart, highlighting the infer
    {
      code: inferCode,
      errors: [CONDITIONAL, { ...INFER, ...spanOf(inferCode, "infer E") }],
    },

    // reports each nested conditional
    {
      code: "type N<T> = T extends string ? 1 : T extends number ? 2 : 3;",
      errors: [CONDITIONAL, CONDITIONAL],
    },

    // fires in an annotation position too
    { code: "function f(): T extends string ? 1 : 2 { return x; }", errors: [CONDITIONAL] },
  ],
});
