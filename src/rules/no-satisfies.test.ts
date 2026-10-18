import { spanOf, testRule } from "#testing";

import { noSatisfiesRule } from "./no-satisfies.ts";

const SATISFIES = { messageId: "satisfies" };

const objectCode = 'const config = { host: "a" } satisfies Config;';

testRule("no-satisfies", noSatisfiesRule, {
  valid: [
    // allows an annotated declaration
    'const config: Config = { host: "a" };',
    "function f(): Config { return config; }",

    // allows implements on a class
    "class A implements B {}",
    "const A = class implements B {};",

    // allows as const
    'const modes = ["READ", "WRITE"] as const;',

    // ignores an identifier named satisfies
    "const satisfies = 1;",
    "check(satisfies);",
  ],
  invalid: [
    // rejects satisfies on a declaration
    { code: "const a = value satisfies Target;", errors: [SATISFIES] },
    { code: "let n = 1 satisfies number;", errors: [SATISFIES] },

    // rejects satisfies with as const
    { code: 'const modes = ["READ"] as const satisfies Modes;', errors: [SATISFIES] },

    // rejects satisfies on a class expression
    { code: "const A = class {} satisfies B;", errors: [SATISFIES] },

    // rejects satisfies outside a declaration
    { code: "call(value satisfies Target);", errors: [SATISFIES] },
    { code: "function f(): Target { return value satisfies Target; }", errors: [SATISFIES] },
    { code: "export default { a: 1 } satisfies Target;", errors: [SATISFIES] },

    // reports each link of a chain
    { code: "const a = value satisfies A satisfies B;", errors: [SATISFIES, SATISFIES] },

    // highlights the whole satisfies expression
    {
      code: objectCode,
      errors: [{ ...SATISFIES, ...spanOf(objectCode, '{ host: "a" } satisfies Config') }],
    },
  ],
});
