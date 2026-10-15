import { spanOf, testRule } from "#testing";

import { noEnumRule } from "./no-enum.ts";

const ENUM = { messageId: "enum" };

const enumCode = "enum Status { Pending, Done }";

const constEnumCode = "const enum Flag { On }";

testRule("no-enum", noEnumRule, {
  valid: [
    // allows a string union standing in for an enum
    'type Status = "PENDING" | "DONE";',
    'const current: Status = "PENDING";',

    // allows unrelated declarations
    "class Status {}",
    "interface Status { code: number }",
    "const Status = { PENDING: 0 };",
  ],
  invalid: [
    // rejects a numeric enum, naming it and highlighting the name only
    {
      code: enumCode,
      errors: [{ ...ENUM, data: { name: "Status" }, ...spanOf(enumCode, "Status") }],
    },

    // rejects a string enum
    { code: 'enum Status { Pending = "PENDING" }', errors: [ENUM] },

    // rejects a heterogeneous enum
    { code: 'enum Mixed { A = 0, B = "B" }', errors: [ENUM] },

    // rejects a const enum
    { code: "const enum Status { Pending, Done }", errors: [ENUM] },

    // rejects a declared enum
    { code: "declare enum Status { Pending }", errors: [ENUM] },

    // rejects an exported enum
    { code: "export enum Status { Pending, Done }", errors: [ENUM] },
    { code: "export const enum Flag { On }", errors: [ENUM] },

    // reports once per enum regardless of member count
    { code: "enum Status { A, B, C, D, E }", errors: [ENUM] },

    // reports once per enum in a file with several
    { code: "enum A { X }\nenum B { Y }", errors: [ENUM, ENUM] },

    // highlights the name of a const enum
    { code: constEnumCode, errors: [{ ...ENUM, ...spanOf(constEnumCode, "Flag") }] },
  ],
});
