import { describe } from "vite-plus/test";

import { spanOf, testRule } from "#testing";

import { noEnumRule } from "./no-enum.ts";

const ENUM = { messageId: "enum" };

describe("no-enum: allows a string union standing in for an enum", () => {
  testRule("no-enum", noEnumRule, {
    valid: ['type Status = "PENDING" | "DONE";', 'const current: Status = "PENDING";'],
    invalid: [],
  });
});

describe("no-enum: allows unrelated declarations", () => {
  testRule("no-enum", noEnumRule, {
    valid: [
      "class Status {}",
      "interface Status { code: number }",
      "const Status = { PENDING: 0 };",
    ],
    invalid: [],
  });
});

describe("no-enum: rejects a numeric enum", () => {
  testRule("no-enum", noEnumRule, {
    valid: [],
    invalid: [{ code: "enum Status { Pending, Done }", errors: [ENUM] }],
  });
});

describe("no-enum: rejects a string enum", () => {
  testRule("no-enum", noEnumRule, {
    valid: [],
    invalid: [{ code: 'enum Status { Pending = "PENDING" }', errors: [ENUM] }],
  });
});

describe("no-enum: rejects a heterogeneous enum", () => {
  testRule("no-enum", noEnumRule, {
    valid: [],
    invalid: [{ code: 'enum Mixed { A = 0, B = "B" }', errors: [ENUM] }],
  });
});

describe("no-enum: rejects a const enum", () => {
  testRule("no-enum", noEnumRule, {
    valid: [],
    invalid: [{ code: "const enum Status { Pending, Done }", errors: [ENUM] }],
  });
});

describe("no-enum: rejects a declared enum", () => {
  testRule("no-enum", noEnumRule, {
    valid: [],
    invalid: [{ code: "declare enum Status { Pending }", errors: [ENUM] }],
  });
});

describe("no-enum: rejects an exported enum", () => {
  testRule("no-enum", noEnumRule, {
    valid: [],
    invalid: [
      { code: "export enum Status { Pending, Done }", errors: [ENUM] },
      { code: "export const enum Flag { On }", errors: [ENUM] },
    ],
  });
});

describe("no-enum: reports once per enum regardless of member count", () => {
  testRule("no-enum", noEnumRule, {
    valid: [],
    invalid: [{ code: "enum Status { A, B, C, D, E }", errors: [ENUM] }],
  });
});

describe("no-enum: reports once per enum in a file with several", () => {
  testRule("no-enum", noEnumRule, {
    valid: [],
    invalid: [{ code: "enum A { X }\nenum B { Y }", errors: [ENUM, ENUM] }],
  });
});

const enumCode = "enum Status { Pending, Done }";
describe("no-enum: highlights the enum name only", () => {
  testRule("no-enum", noEnumRule, {
    valid: [],
    invalid: [
      {
        code: enumCode,
        errors: [{ ...ENUM, data: { name: "Status" }, ...spanOf(enumCode, "Status") }],
      },
    ],
  });
});

const constEnumCode = "const enum Flag { On }";
describe("no-enum: highlights the name of a const enum", () => {
  testRule("no-enum", noEnumRule, {
    valid: [],
    invalid: [{ code: constEnumCode, errors: [{ ...ENUM, ...spanOf(constEnumCode, "Flag") }] }],
  });
});
