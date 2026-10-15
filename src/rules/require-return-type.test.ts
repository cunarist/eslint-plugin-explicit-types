import { describe } from "vite-plus/test";

import { spanOf, testRule } from "#testing";

import { requireReturnTypeRule } from "./require-return-type.ts";

const FUNCTION = { messageId: "function" };
const METHOD_SIGNATURE = { messageId: "methodSignature" };

describe("require-return-type: allows an annotated function", () => {
  testRule("require-return-type", requireReturnTypeRule, {
    valid: [
      "function f(): number { return 1; }",
      "const f = (): number => 1;",
      "class C { m(): void {} }",
      "interface I { m(): void }",
    ],
    invalid: [],
  });
});

describe("require-return-type: rejects a bare function declaration", () => {
  testRule("require-return-type", requireReturnTypeRule, {
    valid: [],
    invalid: [{ code: "function f() { return 1; }", errors: [FUNCTION] }],
  });
});

describe("require-return-type: rejects an assigned arrow or function expression", () => {
  testRule("require-return-type", requireReturnTypeRule, {
    valid: [],
    invalid: [
      { code: "const f = () => 1;", errors: [FUNCTION] },
      { code: "const f = function () { return 1; };", errors: [FUNCTION] },
    ],
  });
});

describe("require-return-type: exempts an inline callback", () => {
  testRule("require-return-type", requireReturnTypeRule, {
    valid: [
      "items.map((item) => item.id);",
      "run(function () { return 1; });",
      "const handlers = [() => 1];",
      "const o = { onClick: () => 1 };",
    ],
    invalid: [],
  });
});

describe("require-return-type: skips constructors and setters", () => {
  // TypeScript rejects a return type annotation on both.
  testRule("require-return-type", requireReturnTypeRule, {
    valid: ["class C { constructor() {} }", "class C { set s(v: number) {} }"],
    invalid: [],
  });
});

describe("require-return-type: checks getters and methods", () => {
  testRule("require-return-type", requireReturnTypeRule, {
    valid: [],
    invalid: [
      { code: "class C { get g() { return 1; } }", errors: [FUNCTION] },
      { code: "class C { m() { return 1; } }", errors: [FUNCTION] },
    ],
  });
});

describe("require-return-type: checks abstract methods and overload signatures", () => {
  testRule("require-return-type", requireReturnTypeRule, {
    valid: ["abstract class C { abstract m(): void; }"],
    invalid: [
      { code: "abstract class C { abstract m(); }", errors: [FUNCTION] },
      { code: "class C { m(); m(): void {} }", errors: [FUNCTION] },
    ],
  });
});

describe("require-return-type: checks interface method signatures", () => {
  testRule("require-return-type", requireReturnTypeRule, {
    valid: ["interface I { m(): void }"],
    invalid: [{ code: "interface I { m() }", errors: [METHOD_SIGNATURE] }],
  });
});

describe("require-return-type: checks declared and overloaded functions", () => {
  testRule("require-return-type", requireReturnTypeRule, {
    valid: ["declare function f(): void;"],
    invalid: [{ code: "declare function f();", errors: [FUNCTION] }],
  });
});

describe("require-return-type: checks async functions", () => {
  testRule("require-return-type", requireReturnTypeRule, {
    valid: ["async function f(): Promise<number> { return 1; }"],
    invalid: [{ code: "async function f() { return 1; }", errors: [FUNCTION] }],
  });
});

const functionCode = "function loadConfig() { return 1; }";
describe("require-return-type: highlights the function name", () => {
  testRule("require-return-type", requireReturnTypeRule, {
    valid: [],
    invalid: [
      { code: functionCode, errors: [{ ...FUNCTION, ...spanOf(functionCode, "loadConfig") }] },
    ],
  });
});

const signatureCode = "interface I { m() }";
describe("require-return-type: highlights the key of a method signature", () => {
  testRule("require-return-type", requireReturnTypeRule, {
    valid: [],
    invalid: [
      { code: signatureCode, errors: [{ ...METHOD_SIGNATURE, ...spanOf(signatureCode, "m") }] },
    ],
  });
});
