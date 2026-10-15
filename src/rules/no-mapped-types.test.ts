import { describe } from "vite-plus/test";

import { spanOf, testRule } from "#testing";

import { noMappedTypesRule } from "./no-mapped-types.ts";

const MAPPED = { messageId: "mappedType" };

describe("no-mapped-types: allows concrete fields and a Map", () => {
  testRule("no-mapped-types", noMappedTypesRule, {
    valid: [
      "interface A { darkMode: boolean }",
      "type A = { darkMode: boolean };",
      "const m = new Map<string, boolean>();",
    ],
    invalid: [],
  });
});

describe("no-mapped-types: ignores index signatures", () => {
  testRule("no-mapped-types", noMappedTypesRule, {
    valid: ["interface A { [k: string]: number }"],
    invalid: [],
  });
});

describe("no-mapped-types: rejects a plain mapped type", () => {
  testRule("no-mapped-types", noMappedTypesRule, {
    valid: [],
    invalid: [{ code: "type A = { [K in B]: boolean };", errors: [MAPPED] }],
  });
});

describe("no-mapped-types: rejects every modifier variant", () => {
  testRule("no-mapped-types", noMappedTypesRule, {
    valid: [],
    invalid: [
      { code: "type A = { [K in B]?: boolean };", errors: [MAPPED] },
      { code: "type A = { [K in B]-?: boolean };", errors: [MAPPED] },
      { code: "type A = { readonly [K in B]: boolean };", errors: [MAPPED] },
      { code: "type A = { -readonly [K in B]: boolean };", errors: [MAPPED] },
    ],
  });
});

describe("no-mapped-types: rejects a renaming as clause", () => {
  testRule("no-mapped-types", noMappedTypesRule, {
    valid: [],
    invalid: [{ code: "type A = { [K in B as `on${K}`]: boolean };", errors: [MAPPED] }],
  });
});

describe("no-mapped-types: fires once per mapped type", () => {
  testRule("no-mapped-types", noMappedTypesRule, {
    valid: [],
    invalid: [{ code: "type A = { [K in B]: { [J in C]: boolean } };", errors: [MAPPED, MAPPED] }],
  });
});

const highlighted = "type A = { [K in B]: boolean };";
describe("no-mapped-types: highlights the whole construct", () => {
  testRule("no-mapped-types", noMappedTypesRule, {
    valid: [],
    invalid: [
      {
        code: highlighted,
        errors: [{ ...MAPPED, ...spanOf(highlighted, "{ [K in B]: boolean }") }],
      },
    ],
  });
});
