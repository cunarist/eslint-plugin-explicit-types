import { spanOf, testRule } from "#testing";

import { noTypeofTypeRule } from "./no-typeof-type.ts";

const TYPEOF = { messageId: "typeofType" };

const highlighted = "type A = typeof defaults;";

testRule("no-typeof-type", noTypeofTypeRule, {
  valid: [
    // allows the runtime typeof operator
    'if (typeof x === "string") { run(); }',
    "const kind = typeof value;",

    // allows a named type
    "function f(options: Options): void {}",
  ],
  invalid: [
    // rejects typeof in every type position
    { code: "function f(o: typeof defaults): void {}", errors: [TYPEOF] },
    { code: "function f(): typeof defaults {}", errors: [TYPEOF] },
    { code: "interface A { field: typeof defaults }", errors: [TYPEOF] },

    // rejects a typeof import query
    { code: 'type A = typeof import("./index.ts");', errors: [TYPEOF] },

    // fires once inside keyof typeof
    { code: "type A = keyof typeof defaults;", errors: [TYPEOF] },

    // highlights the whole query
    { code: highlighted, errors: [{ ...TYPEOF, ...spanOf(highlighted, "typeof defaults") }] },
  ],
});
