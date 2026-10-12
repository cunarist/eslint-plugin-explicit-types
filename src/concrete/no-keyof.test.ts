import { describe } from "vite-plus/test";

import { spanOf, testRule } from "#testing";

import { noKeyof } from "./no-keyof.ts";

describe("no-keyof: allows a written-out key union", () => {
  testRule("no-keyof", noKeyof, {
    valid: ['type A = "TITLE" | "AUTHOR";', "function f(field: string): void {}"],
    invalid: [],
  });
});

describe("no-keyof: ignores the readonly operator", () => {
  testRule("no-keyof", noKeyof, {
    valid: ["type A = readonly string[];", "function f(xs: readonly number[]): void {}"],
    invalid: [],
  });
});

describe("no-keyof: rejects keyof in every type position", () => {
  testRule("no-keyof", noKeyof, {
    valid: [],
    invalid: [
      { code: "type A = keyof B;", errors: [{ messageId: "keyof" }] },
      { code: "function f(k: keyof A): void {}", errors: [{ messageId: "keyof" }] },
      { code: "function f(): keyof A {}", errors: [{ messageId: "keyof" }] },
      { code: "interface A { field: keyof B }", errors: [{ messageId: "keyof" }] },
      { code: "function f<T extends keyof A>(): void {}", errors: [{ messageId: "keyof" }] },
    ],
  });
});

describe("no-keyof: rejects keyof inside a mapped type constraint", () => {
  testRule("no-keyof", noKeyof, {
    valid: [],
    invalid: [{ code: "type A = { [K in keyof B]: string };", errors: [{ messageId: "keyof" }] }],
  });
});

describe("no-keyof: fires once per keyof operator", () => {
  testRule("no-keyof", noKeyof, {
    valid: [],
    invalid: [
      {
        code: "type A = keyof B | keyof C;",
        errors: [{ messageId: "keyof" }, { messageId: "keyof" }],
      },
    ],
  });
});

const highlighted = "type A = keyof Article;";
describe("no-keyof: highlights the whole keyof operator", () => {
  testRule("no-keyof", noKeyof, {
    valid: [],
    invalid: [
      {
        code: highlighted,
        errors: [{ messageId: "keyof", ...spanOf(highlighted, "keyof Article") }],
      },
    ],
  });
});
