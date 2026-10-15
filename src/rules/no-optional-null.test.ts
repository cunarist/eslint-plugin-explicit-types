import { describe } from "vite-plus/test";

import { spanOf, testRule } from "#testing";

import { noOptionalNullRule } from "./no-optional-null.ts";

const NAMED = { messageId: "named" };

describe("no-optional-null: allows one spelling of absence", () => {
  testRule("no-optional-null", noOptionalNullRule, {
    valid: ["function f(a?: string): void {}", "function f(a: string | null): void {}"],
    invalid: [],
  });
});

describe("no-optional-null: allows a default value alongside null", () => {
  testRule("no-optional-null", noOptionalNullRule, {
    valid: ["function f(a: string | null = null): void {}"],
    invalid: [],
  });
});

describe("no-optional-null: rejects an optional parameter unioned with null", () => {
  testRule("no-optional-null", noOptionalNullRule, {
    valid: [],
    invalid: [
      { code: "function f(a?: string | null): void {}", errors: [NAMED] },
      { code: "const f = (a?: string | null): void => {};", errors: [NAMED] },
      { code: "declare function f(a?: string | null): void;", errors: [NAMED] },
    ],
  });
});

describe("no-optional-null: rejects it on function types and method signatures", () => {
  testRule("no-optional-null", noOptionalNullRule, {
    valid: [],
    invalid: [
      { code: "type Fn = (a?: Element | null) => void;", errors: [NAMED] },
      { code: "interface A { m(a?: string | null): void }", errors: [NAMED] },
      { code: "class C { m(a?: string | null): void {} }", errors: [NAMED] },
    ],
  });
});

describe("no-optional-null: rejects a bare optional null", () => {
  testRule("no-optional-null", noOptionalNullRule, {
    valid: [],
    invalid: [{ code: "function f(a?: null): void {}", errors: [NAMED] }],
  });
});

describe("no-optional-null: rejects it on members too", () => {
  testRule("no-optional-null", noOptionalNullRule, {
    valid: [],
    invalid: [
      { code: "interface A { m?: string | null }", errors: [NAMED] },
      { code: "type A = { m?: string | null };", errors: [NAMED] },
      { code: "class C { a?: string | null; }", errors: [NAMED] },
      { code: "abstract class C { abstract a?: string | null; }", errors: [NAMED] },
    ],
  });
});

describe("no-optional-null: allows a member with one spelling", () => {
  testRule("no-optional-null", noOptionalNullRule, {
    valid: ["interface A { m: string | null }", "interface A { m?: string }"],
    invalid: [],
  });
});

describe("no-optional-null: ignores null outside an optional binding", () => {
  testRule("no-optional-null", noOptionalNullRule, {
    valid: [
      "function f(): string | null { return null; }",
      "const v: string | null = null;",
      "interface A { a: string | null }",
    ],
    invalid: [],
  });
});

describe("no-optional-null: names the binding", () => {
  testRule("no-optional-null", noOptionalNullRule, {
    valid: [],
    invalid: [
      {
        code: "function f(path?: string | null): void {}",
        errors: [{ ...NAMED, data: { name: "path" } }],
      },
      {
        code: "interface A { path?: string | null }",
        errors: [{ ...NAMED, data: { name: "path" } }],
      },
    ],
  });
});

describe("no-optional-null: falls back when the key is not a string", () => {
  testRule("no-optional-null", noOptionalNullRule, {
    valid: [],
    invalid: [{ code: "interface A { 0?: string | null }", errors: [{ messageId: "unnamed" }] }],
  });
});

const highlighted = "function f(a?: string | null): void {}";
describe("no-optional-null: highlights the null keyword", () => {
  testRule("no-optional-null", noOptionalNullRule, {
    valid: [],
    invalid: [{ code: highlighted, errors: [{ ...NAMED, ...spanOf(highlighted, "null") }] }],
  });
});
