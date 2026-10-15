import { type ExpectedError, spanOf, testRule } from "#testing";

import { noEnumRule } from "./no-enum.ts";

const ENUM = { messageId: "enum" };

const NO_UNION = { ...ENUM, suggestions: [] };

/** An error on enum `name`, suggesting the union that leaves `output`. */
function toUnion(name: string, output: string): ExpectedError {
  return {
    ...ENUM,
    data: { name },
    suggestions: [{ messageId: "toUnion", data: { name }, output }],
  };
}

/** An error on an enum the fix turns into a union. */
const FIXED = { ...ENUM, suggestions: [] };

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

    // fixes a string enum private to a module into the union of its values
    {
      code: 'export {};\nenum Status { Pending = "PENDING", Done = "DONE" }',
      output: 'export {};\ntype Status = "PENDING" | "DONE";',
      errors: [FIXED],
    },
    {
      code: 'import { show } from "./show.ts";\nenum Status { Open = "OPEN" }\nshow((status: Status): Status[] => [status]);',
      output:
        'import { show } from "./show.ts";\ntype Status = "OPEN";\nshow((status: Status): Status[] => [status]);',
      errors: [FIXED],
    },
    {
      code: 'export {};\ndeclare const enum Mode { Fast = "FAST" }',
      output: 'export {};\ntype Mode = "FAST";',
      errors: [FIXED],
    },

    // only suggests the union for an enum other files may see
    {
      code: 'export enum Status { Open = "OPEN" }',
      errors: [toUnion("Status", 'export type Status = "OPEN";')],
    },
    {
      code: 'export {};\ndeclare global {\n  enum Status { Open = "OPEN" }\n}',
      errors: [toUnion("Status", 'export {};\ndeclare global {\n  type Status = "OPEN";\n}')],
    },
    {
      code: 'export namespace Api {\n  export enum Status { Open = "OPEN" }\n}',
      errors: [toUnion("Status", 'export namespace Api {\n  export type Status = "OPEN";\n}')],
    },

    // only suggests the union for an enum pascal-case-types would still reject
    {
      code: 'export {};\nenum status { Open = "OPEN" }',
      errors: [toUnion("status", 'export {};\ntype status = "OPEN";')],
    },

    // offers no union for an enum exported under another name or by default
    { code: 'enum Status { Open = "OPEN" }\nexport { Status as State };', errors: [NO_UNION] },
    { code: 'enum Status { Open = "OPEN" }\nexport default Status;', errors: [NO_UNION] },

    // offers no union for an enum merged with a namespace
    {
      code: 'export {};\nenum Status { Open = "OPEN" }\nnamespace Status {}',
      errors: [NO_UNION],
    },

    // only suggests the union of a string enum in a script, whose names are global
    {
      code: 'enum Status { Pending = "PENDING", Done = "DONE" }',
      errors: [toUnion("Status", 'type Status = "PENDING" | "DONE";')],
    },
    {
      code: "export const enum Mode { Fast = 'FAST' }",
      errors: [toUnion("Mode", 'export type Mode = "FAST";')],
    },
    {
      code: 'declare enum Mode { Fast = "FAST" }',
      errors: [toUnion("Mode", 'type Mode = "FAST";')],
    },

    // keeps uses of the enum as a bare type, which the union also satisfies
    {
      code: 'enum Status { Open = "OPEN" }\nfunction show(status: Status): Status[] {\n  return [status];\n}',
      errors: [
        toUnion(
          "Status",
          'type Status = "OPEN";\nfunction show(status: Status): Status[] {\n  return [status];\n}',
        ),
      ],
    },

    // offers no union when a member is named, which a union cannot express
    {
      code: 'enum Status { Open = "OPEN" }\nconst current = Status.Open;',
      errors: [NO_UNION],
    },
    {
      code: 'enum Status { Open = "OPEN" }\nlet current: Status.Open;',
      errors: [NO_UNION],
    },
    { code: 'enum Status { Open = "OPEN" }\nexport { Status };', errors: [NO_UNION] },

    // offers no union for values it would have to change
    { code: 'enum Status { Pending = "pending" }', errors: [NO_UNION] },
    { code: "enum Status { Pending = 0 }", errors: [NO_UNION] },
    { code: 'enum Status { Pending = "PENDING", Done = 1 }', errors: [NO_UNION] },
    { code: 'enum Status { Open = "OPEN", Opened = "OPEN" }', errors: [NO_UNION] },
    { code: "enum Status {}", errors: [NO_UNION] },

    // offers no union that would drop a comment
    { code: 'enum Status {\n  // Waiting.\n  Pending = "PENDING",\n}', errors: [NO_UNION] },

    // offers no union for a merged enum
    {
      code: 'enum Status { Open = "OPEN" }\nenum Status { Done = "DONE" }',
      errors: [NO_UNION, NO_UNION],
    },

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
