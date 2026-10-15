import type { RuleTester } from "eslint";

import { spanOf, testRule } from "#testing";

import { noUndefinedTypeRule } from "./no-undefined-type.ts";

const UNDEFINED = { messageId: "undefinedType" };

const highlighted = "type A = string | undefined;";

/** The undefined error, offering `?` in its place with the given result. */
function markOptional(output: string): RuleTester.TestCaseError {
  return { ...UNDEFINED, suggestions: [{ messageId: "markOptional", output }] };
}

/** The undefined error, offering to drop the repeated `| undefined`. */
function dropUndefined(output: string): RuleTester.TestCaseError {
  return { ...UNDEFINED, suggestions: [{ messageId: "dropUndefined", output }] };
}

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
    {
      code: "interface A { a: string | undefined }",
      errors: [markOptional("interface A { a?: string }")],
    },
    {
      code: "class C { a: string | undefined = null; }",
      errors: [markOptional("class C { a?: string = null; }")],
    },

    // rejects undefined on an accessor field
    // Deno's lint AST never walked an `accessor` type annotation; Oxlint's does.
    { code: "class C { accessor a: string | undefined; }", errors: [UNDEFINED] },

    // rejects undefined on a parameter
    {
      code: "function f(a: string | undefined): void {}",
      errors: [markOptional("function f(a?: string): void {}")],
    },
    {
      code: "const f = (a: string | undefined): void => {};",
      errors: [markOptional("const f = (a?: string): void => {};")],
    },
    {
      code: "declare function f(a: string | undefined): void;",
      errors: [markOptional("declare function f(a?: string): void;")],
    },
    {
      code: "interface A { m(a: string | undefined): void }",
      errors: [markOptional("interface A { m(a?: string): void }")],
    },
    {
      code: "class C { m(a: string | undefined): void {} }",
      errors: [markOptional("class C { m(a?: string): void {} }")],
    },

    // rejects undefined on a nested callback parameter
    {
      code: "type Fn = (cb: Element | undefined) => void;",
      errors: [markOptional("type Fn = (cb?: Element) => void;")],
    },
    {
      code: "function f(cb: (a: number | undefined) => void): void {}",
      errors: [markOptional("function f(cb: (a?: number) => void): void {}")],
    },

    // rejects undefined on defaulted and parameter properties
    { code: 'function f(a: string | undefined = "x"): void {}', errors: [UNDEFINED] },
    {
      code: "class C { constructor(private a: string | undefined) {} }",
      errors: [markOptional("class C { constructor(private a?: string) {} }")],
    },

    // rejects undefined nested in a type argument
    { code: "function f(xs: Array<string | undefined>): void {}", errors: [UNDEFINED] },
    { code: "function f(): Map<string, string | undefined> {}", errors: [UNDEFINED] },

    // marks a parameter optional when only optional ones follow it
    {
      code: "function f(a: undefined | string, b?: number, ...c: number[]): void {}",
      errors: [markOptional("function f(a?: string, b?: number, ...c: number[]): void {}")],
    },
    {
      code: "class C { constructor(private a: string | undefined, b = 1) {} }",
      errors: [markOptional("class C { constructor(private a?: string, b = 1) {} }")],
    },
    {
      code: "abstract class C { abstract a: string | undefined; }",
      errors: [markOptional("abstract class C { abstract a?: string; }")],
    },
    {
      code: "interface A { a: string | undefined | number }",
      errors: [markOptional("interface A { a?: string | number }")],
    },

    // offers nothing where a required parameter follows
    { code: "function f(a: string | undefined, b: number): void {}", errors: [UNDEFINED] },

    // offers nothing where the union also admits null, which no-optional-null rejects
    { code: "interface A { a: string | null | undefined }", errors: [UNDEFINED] },

    // offers nothing on a definite or `this` binding
    { code: "class C { a!: string | undefined; }", errors: [UNDEFINED] },
    { code: "function f(this: Window | undefined): void {}", errors: [UNDEFINED] },

    // keeps a comment outside the removed span
    {
      code: "interface A { a: string /* why */ | undefined }",
      errors: [markOptional("interface A { a?: string /* why */ }")],
    },

    // offers nothing where it would delete a comment or parenthesis
    { code: "interface A { a: string | /* why */ undefined }", errors: [UNDEFINED] },
    { code: "interface A { a: string | (undefined) }", errors: [UNDEFINED] },

    // drops the undefined an optional parameter already implies
    {
      code: "function f(a?: string | undefined): void {}",
      output: "function f(a?: string): void {}",
      errors: [UNDEFINED],
    },
    {
      code: "type Fn = (a?: undefined | Element) => void;",
      output: "type Fn = (a?: Element) => void;",
      errors: [UNDEFINED],
    },

    // only suggests dropping it on an optional property, which exactOptionalPropertyTypes tells apart
    {
      code: "interface A { a?: string | undefined }",
      errors: [dropUndefined("interface A { a?: string }")],
    },
    {
      code: "class C { a?: string | undefined; }",
      errors: [dropUndefined("class C { a?: string; }")],
    },
    {
      code: "class C { constructor(private a?: string | undefined) {} }",
      errors: [dropUndefined("class C { constructor(private a?: string) {} }")],
    },

    // fires once per keyword
    { code: "type A = undefined | (string | undefined);", errors: [UNDEFINED, UNDEFINED] },

    // highlights the keyword
    { code: highlighted, errors: [{ ...UNDEFINED, ...spanOf(highlighted, "undefined") }] },
  ],
});
