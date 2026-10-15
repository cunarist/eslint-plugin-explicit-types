import { spanOf, testRule } from "#testing";

import { noTypeAssertionRule } from "./no-type-assertion.ts";

const AS = { messageId: "asAssertion" };
const ANGLE = { messageId: "angleBracketAssertion" };

const asCode = "const el = node as HTMLInputElement;";

const angleCode = "const n = <number> input;";

testRule("no-type-assertion", noTypeAssertionRule, {
  valid: [
    // allows narrowing and annotations
    "const el: HTMLInputElement | null = null;",
    'if (typeof x === "string") { use(x); }',
    "if (node instanceof HTMLElement) { use(node); }",

    // allows as const
    'const modes = ["READ", "WRITE"] as const;',
    'const config = { host: "a" } as const;',
    'const a = "READ" as const;',

    // ignores non-null assertions
    "const a = value!;",
  ],
  invalid: [
    // rejects an as assertion
    { code: "call(value as string);", errors: [AS] },
    { code: "function f(): void { return x as void; }", errors: [AS] },

    // rejects the angle-bracket form
    { code: "const s = <HTMLElement> node;", errors: [ANGLE] },

    // rejects an assertion to a type named Const
    { code: "const a = value as Const;", errors: [AS] },

    // reports each link of a double assertion
    { code: "const a = value as unknown as Target;", errors: [AS, AS] },

    // highlights the whole as expression
    { code: asCode, errors: [{ ...AS, ...spanOf(asCode, "node as HTMLInputElement") }] },

    // highlights the whole angle-bracket expression
    { code: angleCode, errors: [{ ...ANGLE, ...spanOf(angleCode, "<number> input") }] },
  ],
});
