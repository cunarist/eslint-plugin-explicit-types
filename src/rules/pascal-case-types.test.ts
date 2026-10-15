import { type ExpectedSuggestion, spanOf, testRule } from "#testing";

import { pascalCaseTypesRule } from "./pascal-case-types.ts";

const NOT_PASCAL = { messageId: "notPascalCase" };

/** The suggestion to rename `name` to `suggestion`, leaving `output`. */
function rename(name: string, suggestion: string, output: string): ExpectedSuggestion {
  return { messageId: "rename", data: { name, suggestion }, output };
}

const mergedSuggestion = {
  ...NOT_PASCAL,
  suggestions: [
    rename(
      "http_response",
      "HttpResponse",
      "interface HttpResponse { status: number }\ninterface HttpResponse { body: string }",
    ),
  ],
};

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
    // rejects each declaration kind, suggesting the PascalCase name
    {
      code: "class dataStore {}",
      errors: [
        {
          ...NOT_PASCAL,
          data: { kind: "Class", name: "dataStore" },
          suggestions: [rename("dataStore", "DataStore", "class DataStore {}")],
        },
      ],
    },
    {
      code: "type user_profile = { id: string };",
      errors: [
        {
          ...NOT_PASCAL,
          data: { kind: "Type alias", name: "user_profile" },
          suggestions: [
            rename("user_profile", "UserProfile", "type UserProfile = { id: string };"),
          ],
        },
      ],
    },
    {
      code: "enum status_code { Ok }",
      errors: [
        {
          ...NOT_PASCAL,
          data: { kind: "Enum", name: "status_code" },
          suggestions: [rename("status_code", "StatusCode", "enum StatusCode { Ok }")],
        },
      ],
    },

    // rejects a named class expression
    {
      code: "const C = class my_class {};",
      errors: [
        {
          ...NOT_PASCAL,
          suggestions: [rename("my_class", "MyClass", "const C = class MyClass {};")],
        },
      ],
    },

    // rejects underscores anywhere in the name
    {
      code: "class User_Profile {}",
      errors: [
        {
          ...NOT_PASCAL,
          suggestions: [rename("User_Profile", "UserProfile", "class UserProfile {}")],
        },
      ],
    },
    {
      code: "interface Http_Response { status: number }",
      errors: [
        {
          ...NOT_PASCAL,
          suggestions: [
            rename("Http_Response", "HttpResponse", "interface HttpResponse { status: number }"),
          ],
        },
      ],
    },

    // rejects a lowercase or digit first character
    {
      code: "type _Internal = { id: string };",
      errors: [
        {
          ...NOT_PASCAL,
          suggestions: [rename("_Internal", "Internal", "type Internal = { id: string };")],
        },
      ],
    },

    // fires on an exported declaration
    {
      code: "export class data_store {}",
      errors: [
        {
          ...NOT_PASCAL,
          suggestions: [rename("data_store", "DataStore", "export class DataStore {}")],
        },
      ],
    },
    {
      code: "export interface http_response { status: number }",
      errors: [
        {
          ...NOT_PASCAL,
          suggestions: [
            rename(
              "http_response",
              "HttpResponse",
              "export interface HttpResponse { status: number }",
            ),
          ],
        },
      ],
    },

    // highlights the identifier only
    {
      code: classCode,
      errors: [
        {
          ...NOT_PASCAL,
          ...spanOf(classCode, "data_store"),
          suggestions: [rename("data_store", "DataStore", "class DataStore { run() {} }")],
        },
      ],
    },

    // highlights an interface identifier only, naming its kind
    {
      code: interfaceCode,
      errors: [
        {
          ...NOT_PASCAL,
          data: { kind: "Interface", name: "http_response" },
          ...spanOf(interfaceCode, "http_response"),
          suggestions: [
            rename("http_response", "HttpResponse", "interface HttpResponse { status: number }"),
          ],
        },
      ],
    },

    // renames every reference in the file along with the declaration
    {
      code: "type user_id = string;\nfunction f(id: user_id): user_id[] {\n  return [id];\n}",
      errors: [
        {
          ...NOT_PASCAL,
          suggestions: [
            rename(
              "user_id",
              "UserId",
              "type UserId = string;\nfunction f(id: UserId): UserId[] {\n  return [id];\n}",
            ),
          ],
        },
      ],
    },

    // renames a class's references to itself from inside its body
    {
      code: "class data_store {\n  static create(): data_store {\n    return new data_store();\n  }\n}",
      errors: [
        {
          ...NOT_PASCAL,
          suggestions: [
            rename(
              "data_store",
              "DataStore",
              "class DataStore {\n  static create(): DataStore {\n    return new DataStore();\n  }\n}",
            ),
          ],
        },
      ],
    },

    // keeps the key of a shorthand property, so the object keeps its shape
    {
      code: "class data_store {}\nconst registry = { data_store };",
      errors: [
        {
          ...NOT_PASCAL,
          suggestions: [
            rename(
              "data_store",
              "DataStore",
              "class DataStore {}\nconst registry = { data_store: DataStore };",
            ),
          ],
        },
      ],
    },

    // renames every declaration of a merged interface
    {
      code: "interface http_response { status: number }\ninterface http_response { body: string }",
      errors: [mergedSuggestion, mergedSuggestion],
    },

    // offers no rename the new name would collide with
    {
      code: "type user_profile = { id: string };\ntype UserProfile = { name: string };",
      errors: [{ ...NOT_PASCAL, suggestions: [] }],
    },

    // offers no rename when no PascalCase spelling exists
    { code: "type _1 = { id: string };", errors: [{ ...NOT_PASCAL, suggestions: [] }] },
  ],
});
