import type { RuleTester } from "eslint";

import { spanOf, testRule } from "#testing";

import { noOptionalNullRule } from "./no-optional-null.ts";

const NAMED = { messageId: "named" };

const highlighted = "function f(a?: string | null): void {}";

/** Suggestions to drop `| null` and to drop `?`, in that order. */
function both(dropNull: string, dropOptional: string): RuleTester.SuggestionOutput[] {
  return [
    { messageId: "dropNull", output: dropNull },
    { messageId: "dropOptional", output: dropOptional },
  ];
}

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
    {
      code: "const f = (a?: string | null): void => {};",
      errors: [
        {
          ...NAMED,
          suggestions: both(
            "const f = (a?: string): void => {};",
            "const f = (a: string | null): void => {};",
          ),
        },
      ],
    },
    {
      code: "declare function f(a?: string | null): void;",
      errors: [
        {
          ...NAMED,
          suggestions: both(
            "declare function f(a?: string): void;",
            "declare function f(a: string | null): void;",
          ),
        },
      ],
    },

    // rejects it on function types and method signatures
    {
      code: "type Fn = (a?: Element | null) => void;",
      errors: [
        {
          ...NAMED,
          suggestions: both(
            "type Fn = (a?: Element) => void;",
            "type Fn = (a: Element | null) => void;",
          ),
        },
      ],
    },
    {
      code: "interface A { m(a?: string | null): void }",
      errors: [
        {
          ...NAMED,
          suggestions: both(
            "interface A { m(a?: string): void }",
            "interface A { m(a: string | null): void }",
          ),
        },
      ],
    },
    {
      code: "class C { m(a?: string | null): void {} }",
      errors: [
        {
          ...NAMED,
          suggestions: both(
            "class C { m(a?: string): void {} }",
            "class C { m(a: string | null): void {} }",
          ),
        },
      ],
    },

    // rejects a bare optional null
    {
      code: "function f(a?: null): void {}",
      errors: [
        {
          ...NAMED,
          suggestions: [{ messageId: "dropOptional", output: "function f(a: null): void {}" }],
        },
      ],
    },

    // rejects it on members too
    {
      code: "interface A { m?: string | null }",
      errors: [
        {
          ...NAMED,
          suggestions: both("interface A { m?: string }", "interface A { m: string | null }"),
        },
      ],
    },
    {
      code: "type A = { m?: string | null };",
      errors: [
        {
          ...NAMED,
          suggestions: both("type A = { m?: string };", "type A = { m: string | null };"),
        },
      ],
    },
    // only drops `| null` on a field with no initializer, which `?` keeps from failing strictPropertyInitialization
    {
      code: "class C { a?: string | null; }",
      errors: [
        { ...NAMED, suggestions: [{ messageId: "dropNull", output: "class C { a?: string; }" }] },
      ],
    },
    {
      code: "class C { a?: null | string = null; }",
      errors: [
        {
          ...NAMED,
          suggestions: both(
            "class C { a?: string = null; }",
            "class C { a: null | string = null; }",
          ),
        },
      ],
    },
    {
      code: "class C { declare a?: string | null; }",
      errors: [
        {
          ...NAMED,
          suggestions: both(
            "class C { declare a?: string; }",
            "class C { declare a: string | null; }",
          ),
        },
      ],
    },

    // offers only what leaves a comment in place
    {
      code: "interface A { m?: string | /* why */ null }",
      errors: [
        {
          ...NAMED,
          suggestions: [
            { messageId: "dropOptional", output: "interface A { m: string | /* why */ null }" },
          ],
        },
      ],
    },
    {
      code: "abstract class C { abstract a?: string | null; }",
      errors: [
        {
          ...NAMED,
          suggestions: both(
            "abstract class C { abstract a?: string; }",
            "abstract class C { abstract a: string | null; }",
          ),
        },
      ],
    },

    // names the binding
    {
      code: "function f(path?: string | null): void {}",
      errors: [
        {
          ...NAMED,
          data: { name: "path" },
          suggestions: both(
            "function f(path?: string): void {}",
            "function f(path: string | null): void {}",
          ),
        },
      ],
    },
    {
      code: "interface A { path?: string | null }",
      errors: [
        {
          ...NAMED,
          data: { name: "path" },
          suggestions: both("interface A { path?: string }", "interface A { path: string | null }"),
        },
      ],
    },

    // falls back when the key is not a string
    {
      code: "interface A { 0?: string | null }",
      errors: [
        {
          messageId: "unnamed",
          suggestions: both("interface A { 0?: string }", "interface A { 0: string | null }"),
        },
      ],
    },

    // highlights the null keyword
    {
      code: highlighted,
      errors: [
        {
          ...NAMED,
          ...spanOf(highlighted, "null"),
          suggestions: both(
            "function f(a?: string): void {}",
            "function f(a: string | null): void {}",
          ),
        },
      ],
    },
  ],
});
