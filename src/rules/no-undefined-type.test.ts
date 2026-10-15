import { spanOf, testRule } from "#testing";

import { noUndefinedTypeRule } from "./no-undefined-type.ts";

const UNDEFINED = { messageId: "undefinedType" };

const highlighted = "type A = string | undefined;";

testRule("no-undefined-type", noUndefinedTypeRule, {
  valid: [
    // allows null for absence
    "function f(): Note | null { return null; }",
    "const v: string | null = null;",
    "interface A { cursor: string | null }",

    // allows the optional marker instead
    "function f(a?: number): void {}",
    "type Fn = (cb?: Element) => void;",
    "interface A { m(a?: number): void }",

    // leaves void alone
    "function f(): void {}",
  ],
  invalid: [
    // rejects undefined in a return type
    { code: "function f(): Note | undefined {}", errors: [UNDEFINED] },
    { code: "const f = function (): Note | undefined {};", errors: [UNDEFINED] },
    { code: "declare function f(): undefined;", errors: [UNDEFINED] },
    { code: "interface A { m(): string | undefined }", errors: [UNDEFINED] },

    // rejects undefined on values and members
    { code: "const v: string | undefined = undefined;", errors: [UNDEFINED] },
    { code: "let w: undefined;", errors: [UNDEFINED] },
    { code: "interface A { a: string | undefined }", errors: [UNDEFINED] },
    { code: "class C { a: string | undefined = null; }", errors: [UNDEFINED] },

    // rejects undefined on an accessor field
    // Deno's lint AST never walked an `accessor` type annotation; Oxlint's does.
    { code: "class C { accessor a: string | undefined; }", errors: [UNDEFINED] },

    // rejects undefined on a parameter
    { code: "function f(a: string | undefined): void {}", errors: [UNDEFINED] },
    { code: "const f = (a: string | undefined): void => {};", errors: [UNDEFINED] },
    { code: "declare function f(a: string | undefined): void;", errors: [UNDEFINED] },
    { code: "interface A { m(a: string | undefined): void }", errors: [UNDEFINED] },
    { code: "class C { m(a: string | undefined): void {} }", errors: [UNDEFINED] },

    // rejects undefined on a nested callback parameter
    { code: "type Fn = (cb: Element | undefined) => void;", errors: [UNDEFINED] },
    { code: "function f(cb: (a: number | undefined) => void): void {}", errors: [UNDEFINED] },

    // rejects undefined on defaulted and parameter properties
    { code: 'function f(a: string | undefined = "x"): void {}', errors: [UNDEFINED] },
    { code: "class C { constructor(private a: string | undefined) {} }", errors: [UNDEFINED] },

    // rejects undefined nested in a type argument
    { code: "function f(xs: Array<string | undefined>): void {}", errors: [UNDEFINED] },
    { code: "function f(): Map<string, string | undefined> {}", errors: [UNDEFINED] },

    // fires once per keyword
    { code: "type A = undefined | (string | undefined);", errors: [UNDEFINED, UNDEFINED] },

    // highlights the keyword
    { code: highlighted, errors: [{ ...UNDEFINED, ...spanOf(highlighted, "undefined") }] },
  ],
});
