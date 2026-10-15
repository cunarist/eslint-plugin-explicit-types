import { spanOf, testRule } from "#testing";

import { noKeyofRule } from "./no-keyof.ts";

const highlighted = "type A = keyof Article;";

testRule("no-keyof", noKeyofRule, {
  valid: [
    // allows a written-out key union
    'type A = "TITLE" | "AUTHOR";',
    "function f(field: string): void {}",

    // ignores the readonly operator
    "type A = readonly string[];",
    "function f(xs: readonly number[]): void {}",
  ],
  invalid: [
    // rejects keyof in every type position
    { code: "type A = keyof B;", errors: [{ messageId: "keyof" }] },
    { code: "function f(k: keyof A): void {}", errors: [{ messageId: "keyof" }] },
    { code: "function f(): keyof A {}", errors: [{ messageId: "keyof" }] },
    { code: "interface A { field: keyof B }", errors: [{ messageId: "keyof" }] },
    { code: "function f<T extends keyof A>(): void {}", errors: [{ messageId: "keyof" }] },

    // rejects keyof inside a mapped type constraint
    { code: "type A = { [K in keyof B]: string };", errors: [{ messageId: "keyof" }] },

    // fires once per keyof operator
    {
      code: "type A = keyof B | keyof C;",
      errors: [{ messageId: "keyof" }, { messageId: "keyof" }],
    },

    // highlights the whole keyof operator
    {
      code: highlighted,
      errors: [{ messageId: "keyof", ...spanOf(highlighted, "keyof Article") }],
    },
  ],
});
