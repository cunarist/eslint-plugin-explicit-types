import { spanOf, testRule } from "#testing";

import { pascalCaseTypesRule } from "./pascal-case-types.ts";

const NOT_PASCAL = { messageId: "notPascalCase" };

const classCode = "class data_store { run() {} }";

const interfaceCode = "interface http_response { status: number }";

testRule("pascal-case-types", pascalCaseTypesRule, {
  valid: [
    // allows PascalCase declarations
    "class DataStore {}",
    "interface HttpResponse { status: number }",
    "type UserProfile = { id: string };",
    "enum Status { Pending }",

    // allows digits after the first letter
    "class Base64Encoder {}",
    "interface Http2Stream { id: number }",

    // skips anonymous class expressions
    "const C = class {};",
    "export default class {}",
  ],
  invalid: [
    // rejects each declaration kind
    {
      code: "class dataStore {}",
      errors: [{ ...NOT_PASCAL, data: { kind: "Class", name: "dataStore" } }],
    },
    {
      code: "type user_profile = { id: string };",
      errors: [{ ...NOT_PASCAL, data: { kind: "Type alias", name: "user_profile" } }],
    },
    {
      code: "enum status_code { Ok }",
      errors: [{ ...NOT_PASCAL, data: { kind: "Enum", name: "status_code" } }],
    },

    // rejects a named class expression
    { code: "const C = class my_class {};", errors: [NOT_PASCAL] },

    // rejects underscores anywhere in the name
    { code: "class User_Profile {}", errors: [NOT_PASCAL] },
    { code: "interface Http_Response { status: number }", errors: [NOT_PASCAL] },

    // rejects a lowercase or digit first character
    { code: "type _Internal = { id: string };", errors: [NOT_PASCAL] },

    // fires on an exported declaration
    { code: "export class data_store {}", errors: [NOT_PASCAL] },
    { code: "export interface http_response { status: number }", errors: [NOT_PASCAL] },

    // highlights the identifier only
    { code: classCode, errors: [{ ...NOT_PASCAL, ...spanOf(classCode, "data_store") }] },

    // highlights an interface identifier only, naming its kind
    {
      code: interfaceCode,
      errors: [
        {
          ...NOT_PASCAL,
          data: { kind: "Interface", name: "http_response" },
          ...spanOf(interfaceCode, "http_response"),
        },
      ],
    },
  ],
});
