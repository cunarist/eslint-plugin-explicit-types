import { spanOf, testRule } from "#testing";

import { noOptionalNullRule } from "./no-optional-null.ts";

const NAMED = { messageId: "named" };

const highlighted = "function f(a?: string | null): void {}";

testRule("no-optional-null", noOptionalNullRule, {
  valid: [
    // allows one spelling of absence
    "function f(a?: string): void {}",
    "function f(a: string | null): void {}",

    // allows a default value alongside null
    "function f(a: string | null = null): void {}",

    // allows a member with one spelling
    "interface A { m: string | null }",
    "interface A { m?: string }",

    // ignores null outside an optional binding
    "function f(): string | null { return null; }",
    "const v: string | null = null;",
    "interface A { a: string | null }",
  ],
  invalid: [
    // rejects an optional parameter unioned with null
    { code: "const f = (a?: string | null): void => {};", errors: [NAMED] },
    { code: "declare function f(a?: string | null): void;", errors: [NAMED] },

    // rejects it on function types and method signatures
    { code: "type Fn = (a?: Element | null) => void;", errors: [NAMED] },
    { code: "interface A { m(a?: string | null): void }", errors: [NAMED] },
    { code: "class C { m(a?: string | null): void {} }", errors: [NAMED] },

    // rejects a bare optional null
    { code: "function f(a?: null): void {}", errors: [NAMED] },

    // rejects it on members too
    { code: "interface A { m?: string | null }", errors: [NAMED] },
    { code: "type A = { m?: string | null };", errors: [NAMED] },
    { code: "class C { a?: string | null; }", errors: [NAMED] },
    { code: "abstract class C { abstract a?: string | null; }", errors: [NAMED] },

    // names the binding
    {
      code: "function f(path?: string | null): void {}",
      errors: [{ ...NAMED, data: { name: "path" } }],
    },
    {
      code: "interface A { path?: string | null }",
      errors: [{ ...NAMED, data: { name: "path" } }],
    },

    // falls back when the key is not a string
    { code: "interface A { 0?: string | null }", errors: [{ messageId: "unnamed" }] },

    // highlights the null keyword
    { code: highlighted, errors: [{ ...NAMED, ...spanOf(highlighted, "null") }] },
  ],
});
