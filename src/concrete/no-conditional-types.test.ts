import { describe } from "vite-plus/test";

import { spanOf, testRule } from "#testing";

import { noConditionalTypes } from "./no-conditional-types.ts";

const CONDITIONAL = { messageId: "conditional" };
const INFER = { messageId: "infer" };

describe("no-conditional-types: allows a plain type alias", () => {
  testRule("no-conditional-types", noConditionalTypes, {
    valid: [
      "type Items = TaskSnapshot;",
      "type Wrapper<T> = { value: T };",
      "type Union = string | number;",
    ],
    invalid: [],
  });
});

describe("no-conditional-types: rejects a conditional type", () => {
  testRule("no-conditional-types", noConditionalTypes, {
    valid: [],
    invalid: [{ code: "type Flag<T> = T extends string ? 1 : 2;", errors: [CONDITIONAL] }],
  });
});

describe("no-conditional-types: reports the conditional and the infer separately", () => {
  testRule("no-conditional-types", noConditionalTypes, {
    valid: [],
    invalid: [
      {
        code: "type U<T> = T extends Array<infer E> ? E : never;",
        errors: [CONDITIONAL, INFER],
      },
    ],
  });
});

describe("no-conditional-types: reports each nested conditional", () => {
  testRule("no-conditional-types", noConditionalTypes, {
    valid: [],
    invalid: [
      {
        code: "type N<T> = T extends string ? 1 : T extends number ? 2 : 3;",
        errors: [CONDITIONAL, CONDITIONAL],
      },
    ],
  });
});

describe("no-conditional-types: fires in an annotation position too", () => {
  testRule("no-conditional-types", noConditionalTypes, {
    valid: [],
    invalid: [
      { code: "function f(): T extends string ? 1 : 2 { return x; }", errors: [CONDITIONAL] },
    ],
  });
});

const conditionalCode = "type Flag<T> = T extends string ? 1 : 2;";
describe("no-conditional-types: highlights the conditional type", () => {
  testRule("no-conditional-types", noConditionalTypes, {
    valid: [],
    invalid: [
      {
        code: conditionalCode,
        errors: [{ ...CONDITIONAL, ...spanOf(conditionalCode, "T extends string ? 1 : 2") }],
      },
    ],
  });
});

const inferCode = "type U<T> = T extends Array<infer E> ? E : never;";
describe("no-conditional-types: highlights the infer fragment", () => {
  testRule("no-conditional-types", noConditionalTypes, {
    valid: [],
    invalid: [
      {
        code: inferCode,
        errors: [CONDITIONAL, { ...INFER, ...spanOf(inferCode, "infer E") }],
      },
    ],
  });
});
