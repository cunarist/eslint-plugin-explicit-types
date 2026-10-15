import { spanOf, testRule } from "#testing";

import { requireReturnTypeRule } from "./require-return-type.ts";

const FUNCTION = { messageId: "function" };
const METHOD_SIGNATURE = { messageId: "methodSignature" };

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
    { code: "function f() { return 1; }", errors: [FUNCTION] },

    // rejects an assigned arrow or function expression
    { code: "const f = () => 1;", errors: [FUNCTION] },
    { code: "const f = function () { return 1; };", errors: [FUNCTION] },

    // checks getters and methods
    { code: "class C { get g() { return 1; } }", errors: [FUNCTION] },
    { code: "class C { m() { return 1; } }", errors: [FUNCTION] },

    // checks abstract methods and overload signatures
    { code: "abstract class C { abstract m(); }", errors: [FUNCTION] },
    { code: "class C { m(); m(): void {} }", errors: [FUNCTION] },

    // checks interface method signatures, highlighting the key
    { code: signatureCode, errors: [{ ...METHOD_SIGNATURE, ...spanOf(signatureCode, "m") }] },

    // checks declared and overloaded functions
    { code: "declare function f();", errors: [FUNCTION] },

    // checks async functions
    { code: "async function f() { return 1; }", errors: [FUNCTION] },

    // highlights the function name
    { code: functionCode, errors: [{ ...FUNCTION, ...spanOf(functionCode, "loadConfig") }] },
  ],
});
