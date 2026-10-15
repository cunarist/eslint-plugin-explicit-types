import { describe } from "vite-plus/test";

import { spanOf, testRule } from "#testing";

import { pascalCaseTypesRule } from "./pascal-case-types.ts";

const NOT_PASCAL = { messageId: "notPascalCase" };

describe("pascal-case-types: allows PascalCase declarations", () => {
  testRule("pascal-case-types", pascalCaseTypesRule, {
    valid: [
      "class DataStore {}",
      "interface HttpResponse { status: number }",
      "type UserProfile = { id: string };",
      "enum Status { Pending }",
    ],
    invalid: [],
  });
});

describe("pascal-case-types: allows digits after the first letter", () => {
  testRule("pascal-case-types", pascalCaseTypesRule, {
    valid: ["class Base64Encoder {}", "interface Http2Stream { id: number }"],
    invalid: [],
  });
});

describe("pascal-case-types: skips anonymous class expressions", () => {
  testRule("pascal-case-types", pascalCaseTypesRule, {
    valid: ["const C = class {};", "export default class {}"],
    invalid: [],
  });
});

describe("pascal-case-types: rejects each declaration kind", () => {
  testRule("pascal-case-types", pascalCaseTypesRule, {
    valid: [],
    invalid: [
      {
        code: "class dataStore {}",
        errors: [{ ...NOT_PASCAL, data: { kind: "Class", name: "dataStore" } }],
      },
      {
        code: "interface http_response { status: number }",
        errors: [{ ...NOT_PASCAL, data: { kind: "Interface", name: "http_response" } }],
      },
      {
        code: "type user_profile = { id: string };",
        errors: [{ ...NOT_PASCAL, data: { kind: "Type alias", name: "user_profile" } }],
      },
      {
        code: "enum status_code { Ok }",
        errors: [{ ...NOT_PASCAL, data: { kind: "Enum", name: "status_code" } }],
      },
    ],
  });
});

describe("pascal-case-types: rejects a named class expression", () => {
  testRule("pascal-case-types", pascalCaseTypesRule, {
    valid: [],
    invalid: [{ code: "const C = class my_class {};", errors: [NOT_PASCAL] }],
  });
});

describe("pascal-case-types: rejects underscores anywhere in the name", () => {
  testRule("pascal-case-types", pascalCaseTypesRule, {
    valid: [],
    invalid: [
      { code: "class User_Profile {}", errors: [NOT_PASCAL] },
      { code: "interface Http_Response { status: number }", errors: [NOT_PASCAL] },
    ],
  });
});

describe("pascal-case-types: rejects a lowercase or digit first character", () => {
  testRule("pascal-case-types", pascalCaseTypesRule, {
    valid: [],
    invalid: [
      { code: "class dataStore {}", errors: [NOT_PASCAL] },
      { code: "type _Internal = { id: string };", errors: [NOT_PASCAL] },
    ],
  });
});

describe("pascal-case-types: fires on an exported declaration", () => {
  testRule("pascal-case-types", pascalCaseTypesRule, {
    valid: [],
    invalid: [
      { code: "export class data_store {}", errors: [NOT_PASCAL] },
      { code: "export interface http_response { status: number }", errors: [NOT_PASCAL] },
    ],
  });
});

const classCode = "class data_store { run() {} }";
describe("pascal-case-types: highlights the identifier only", () => {
  testRule("pascal-case-types", pascalCaseTypesRule, {
    valid: [],
    invalid: [{ code: classCode, errors: [{ ...NOT_PASCAL, ...spanOf(classCode, "data_store") }] }],
  });
});

const interfaceCode = "interface http_response { status: number }";
describe("pascal-case-types: highlights an interface identifier only", () => {
  testRule("pascal-case-types", pascalCaseTypesRule, {
    valid: [],
    invalid: [
      {
        code: interfaceCode,
        errors: [{ ...NOT_PASCAL, ...spanOf(interfaceCode, "http_response") }],
      },
    ],
  });
});
