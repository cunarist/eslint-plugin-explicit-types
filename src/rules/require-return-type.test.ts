import { spanOf, testRule } from "#testing";

import { requireReturnTypeRule } from "./require-return-type.ts";

const FUNCTION = { messageId: "function" };
const METHOD_SIGNATURE = { messageId: "methodSignature" };

/** A missing return type with no fix, as TypeScript may infer more. */
const BARE = FUNCTION;

const functionCode = "function loadConfig() { return 1; }";

const signatureCode = "interface I { m() }";

testRule("require-return-type", requireReturnTypeRule, {
  valid: [
    // allows an annotated function
    "function f(): number { return 1; }",
    "const f = (): number => 1;",
    "class C { m(): void {} }",
    "interface I { m(): void }",

    // exempts an inline callback
    "items.map((item) => item.id);",
    "run(function () { return 1; });",
    "const handlers = [() => 1];",
    "const o = { onClick: () => 1 };",

    // skips constructors and setters
    // TypeScript rejects a return type annotation on both.
    "class C { constructor() {} }",
    "class C { set s(v: number) {} }",

    // checks abstract methods and overload signatures
    "abstract class C { abstract m(): void; }",

    // checks declared and overloaded functions
    "declare function f(): void;",

    // checks async functions
    "async function f(): Promise<number> { return 1; }",
  ],
  invalid: [
    // rejects a bare function declaration
    { code: "function f() { return 1; }", errors: [BARE] },

    // fixes void for a function that returns no value
    {
      code: "function f() { run(); }",
      output: "function f(): void { run(); }",
      errors: [FUNCTION],
    },
    {
      code: "function f(a: number) { if (a) { return; } }",
      output: "function f(a: number): void { if (a) { return; } }",
      errors: [FUNCTION],
    },
    {
      code: "function f() { throw new Error(); }",
      output: "function f(): void { throw new Error(); }",
      errors: [FUNCTION],
    },
    {
      code: "export default function () { run(); }",
      output: "export default function (): void { run(); }",
      errors: [FUNCTION],
    },

    // offers no void when a comment sits between the parameters and the body
    { code: "function f() /* c */ { run(); }", errors: [BARE] },

    // looks past nested functions for the returned value
    {
      code: "function f() { items.map((item) => { return item.id; }); }",
      output: "function f(): void { items.map((item) => { return item.id; }); }",
      errors: [FUNCTION],
    },
    {
      code: "function f() { const g = function () { return 1; }; return g; }",
      errors: [BARE, BARE],
    },

    // fixes Promise<void> for an async function
    {
      code: "async function f() { await run(); }",
      output: "async function f(): Promise<void> { await run(); }",
      errors: [FUNCTION],
    },

    // offers no void for a generator
    { code: "function* f() { yield 1; }", errors: [BARE] },

    // rejects an assigned arrow or function expression
    // An expression whose end is unreachable infers never, not void.
    { code: "const f = () => 1;", errors: [BARE] },
    { code: "const f = () => { run(); };", errors: [BARE] },
    { code: "const f = function () { return 1; };", errors: [BARE] },

    // checks getters and methods
    { code: "class C { get g() { return 1; } }", errors: [BARE] },
    { code: "class C { m() { return 1; } }", errors: [BARE] },
    {
      code: "class C { m() { run(); } }",
      output: "class C { m(): void { run(); } }",
      errors: [FUNCTION],
    },
    {
      code: "class C { async m() {} }",
      output: "class C { async m(): Promise<void> {} }",
      errors: [FUNCTION],
    },

    // checks abstract methods and overload signatures
    { code: "abstract class C { abstract m(); }", errors: [BARE] },
    { code: "class C { m(); m(): void {} }", errors: [BARE] },

    // checks interface method signatures, highlighting the key
    { code: signatureCode, errors: [{ ...METHOD_SIGNATURE, ...spanOf(signatureCode, "m") }] },

    // checks declared and overloaded functions
    { code: "declare function f();", errors: [BARE] },

    // checks async functions
    { code: "async function f() { return 1; }", errors: [BARE] },

    // highlights the function name
    { code: functionCode, errors: [{ ...BARE, ...spanOf(functionCode, "loadConfig") }] },
  ],
});
