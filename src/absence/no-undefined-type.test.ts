import { describe } from "vite-plus/test";

import { spanOf, testRule } from "#testing";

import { noUndefinedType } from "./no-undefined-type.ts";

const UNDEFINED = { messageId: "undefinedType" };

describe("no-undefined-type: allows null for absence", () => {
  testRule("no-undefined-type", noUndefinedType, {
    valid: [
      "function f(): Note | null { return null; }",
      "const v: string | null = null;",
      "interface A { cursor: string | null }",
    ],
    invalid: [],
  });
});

describe("no-undefined-type: allows the optional marker instead", () => {
  testRule("no-undefined-type", noUndefinedType, {
    valid: [
      "function f(a?: number): void {}",
      "type Fn = (cb?: Element) => void;",
      "interface A { m(a?: number): void }",
    ],
    invalid: [],
  });
});

describe("no-undefined-type: rejects undefined in a return type", () => {
  testRule("no-undefined-type", noUndefinedType, {
    valid: [],
    invalid: [
      { code: "function f(): Note | undefined {}", errors: [UNDEFINED] },
      { code: "const f = function (): Note | undefined {};", errors: [UNDEFINED] },
      { code: "declare function f(): undefined;", errors: [UNDEFINED] },
      { code: "interface A { m(): string | undefined }", errors: [UNDEFINED] },
    ],
  });
});

describe("no-undefined-type: rejects undefined on values and members", () => {
  testRule("no-undefined-type", noUndefinedType, {
    valid: [],
    invalid: [
      { code: "const v: string | undefined = undefined;", errors: [UNDEFINED] },
      { code: "let w: undefined;", errors: [UNDEFINED] },
      { code: "interface A { a: string | undefined }", errors: [UNDEFINED] },
      { code: "type A = string | undefined;", errors: [UNDEFINED] },
      { code: "class C { a: string | undefined = null; }", errors: [UNDEFINED] },
    ],
  });
});

describe("no-undefined-type: rejects undefined on an accessor field", () => {
  // Deno's lint AST never walked an `accessor` type annotation; Oxlint's does.
  testRule("no-undefined-type", noUndefinedType, {
    valid: [],
    invalid: [{ code: "class C { accessor a: string | undefined; }", errors: [UNDEFINED] }],
  });
});

describe("no-undefined-type: rejects undefined on a parameter", () => {
  testRule("no-undefined-type", noUndefinedType, {
    valid: [],
    invalid: [
      { code: "function f(a: string | undefined): void {}", errors: [UNDEFINED] },
      { code: "const f = (a: string | undefined): void => {};", errors: [UNDEFINED] },
      { code: "declare function f(a: string | undefined): void;", errors: [UNDEFINED] },
      { code: "interface A { m(a: string | undefined): void }", errors: [UNDEFINED] },
      { code: "class C { m(a: string | undefined): void {} }", errors: [UNDEFINED] },
    ],
  });
});

describe("no-undefined-type: rejects undefined on a nested callback parameter", () => {
  testRule("no-undefined-type", noUndefinedType, {
    valid: [],
    invalid: [
      { code: "type Fn = (cb: Element | undefined) => void;", errors: [UNDEFINED] },
      { code: "function f(cb: (a: number | undefined) => void): void {}", errors: [UNDEFINED] },
    ],
  });
});

describe("no-undefined-type: rejects undefined on defaulted and parameter properties", () => {
  testRule("no-undefined-type", noUndefinedType, {
    valid: [],
    invalid: [
      { code: 'function f(a: string | undefined = "x"): void {}', errors: [UNDEFINED] },
      { code: "class C { constructor(private a: string | undefined) {} }", errors: [UNDEFINED] },
    ],
  });
});

describe("no-undefined-type: rejects undefined nested in a type argument", () => {
  testRule("no-undefined-type", noUndefinedType, {
    valid: [],
    invalid: [
      { code: "function f(xs: Array<string | undefined>): void {}", errors: [UNDEFINED] },
      { code: "function f(): Map<string, string | undefined> {}", errors: [UNDEFINED] },
    ],
  });
});

describe("no-undefined-type: leaves void alone", () => {
  testRule("no-undefined-type", noUndefinedType, {
    valid: ["function f(): void {}"],
    invalid: [],
  });
});

describe("no-undefined-type: fires once per keyword", () => {
  testRule("no-undefined-type", noUndefinedType, {
    valid: [],
    invalid: [
      { code: "type A = undefined | (string | undefined);", errors: [UNDEFINED, UNDEFINED] },
    ],
  });
});

const highlighted = "type A = string | undefined;";
describe("no-undefined-type: highlights the keyword", () => {
  testRule("no-undefined-type", noUndefinedType, {
    valid: [],
    invalid: [
      { code: highlighted, errors: [{ ...UNDEFINED, ...spanOf(highlighted, "undefined") }] },
    ],
  });
});
