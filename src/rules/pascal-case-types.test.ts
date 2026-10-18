import { type ExpectedError, type ExpectedSuggestion, spanOf, testRule } from "#testing";

import { pascalCaseTypesRule } from "./pascal-case-types.ts";

const NOT_PASCAL = { messageId: "notPascalCase" };

/** The suggestion to rename `name` to `suggestion`, leaving `output`. */
function rename(name: string, suggestion: string, output: string): ExpectedSuggestion {
  return { messageId: "rename", data: { name, suggestion }, output };
}

/** An error whose only suggestion renames `name` to `suggestion`, leaving `output`. */
function renameError(name: string, suggestion: string, output: string): ExpectedError {
  return { ...NOT_PASCAL, suggestions: [rename(name, suggestion, output)] };
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

/** An error fixed by the rename, which leaves no suggestion behind. */
const FIXED = { ...NOT_PASCAL, suggestions: [] };

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

    // fixes a named class expression, whose name only its own body sees
    {
      code: "const C = class my_class {};",
      output: "const C = class MyClass {};",
      errors: [FIXED],
    },

    // fixes a type private to a module, along with every reference
    {
      code: "export {};\ntype user_id = string;\nfunction f(id: user_id): user_id[] {\n  return [id];\n}",
      output:
        "export {};\ntype UserId = string;\nfunction f(id: UserId): UserId[] {\n  return [id];\n}",
      errors: [FIXED],
    },
    {
      code: 'import { run } from "./run.ts";\nclass data_store {}\nrun(new data_store());',
      output: 'import { run } from "./run.ts";\nclass DataStore {}\nrun(new DataStore());',
      errors: [FIXED],
    },

    // fixes a type declared inside a function, even in a script
    {
      code: "function f(): void {\n  type user_id = string;\n  const id: user_id = '';\n}",
      output: "function f(): void {\n  type UserId = string;\n  const id: UserId = '';\n}",
      errors: [FIXED],
    },

    // fixes every declaration of a merged interface at once
    {
      code: "export {};\ninterface http_response { status: number }\ninterface http_response { body: string }",
      output:
        "export {};\ninterface HttpResponse { status: number }\ninterface HttpResponse { body: string }",
      errors: [FIXED, FIXED],
    },

    // fixes a shadowing type apart from the one it shadows, one per pass
    {
      code: "export {};\ntype user_id = string;\nfunction f(): void {\n  const a: user_id = '';\n  type user_Id = number;\n}",
      output:
        "export {};\ntype UserId = string;\nfunction f(): void {\n  const a: UserId = '';\n  type user_Id = number;\n}",
      errors: [FIXED, FIXED],
    },
    {
      code: "export {};\ntype UserId = string;\nfunction f(): void {\n  const a: UserId = '';\n  type user_Id = number;\n}",
      errors: [{ ...NOT_PASCAL, suggestions: [] }],
    },

    // only suggests renaming a type exported under another name or by default
    {
      code: "type user_id = string;\nexport { user_id as UserIdAlias };",
      errors: [
        renameError(
          "user_id",
          "UserId",
          "type UserId = string;\nexport { UserId as UserIdAlias };",
        ),
      ],
    },
    {
      code: "class data_store {}\nexport default data_store;",
      errors: [
        renameError("data_store", "DataStore", "class DataStore {}\nexport default DataStore;"),
      ],
    },
    {
      code: "export default class data_store {}",
      errors: [renameError("data_store", "DataStore", "export default class DataStore {}")],
    },
    {
      code: "export namespace Api {\n  export type user_id = string;\n}",
      errors: [
        renameError(
          "user_id",
          "UserId",
          "export namespace Api {\n  export type UserId = string;\n}",
        ),
      ],
    },

    // only suggests renaming a global type, which other files can see
    {
      code: "export {};\ndeclare global {\n  interface app_config { debug: boolean }\n}",
      errors: [
        renameError(
          "app_config",
          "AppConfig",
          "export {};\ndeclare global {\n  interface AppConfig { debug: boolean }\n}",
        ),
      ],
    },

    // rejects underscores anywhere in the name
    {
      code: "class User_Profile {}",
      errors: [renameError("User_Profile", "UserProfile", "class UserProfile {}")],
    },
    {
      code: "interface Http_Response { status: number }",
      errors: [
        renameError("Http_Response", "HttpResponse", "interface HttpResponse { status: number }"),
      ],
    },

    // rejects a lowercase or digit first character
    {
      code: "type _Internal = { id: string };",
      errors: [renameError("_Internal", "Internal", "type Internal = { id: string };")],
    },

    // only suggests renaming an exported declaration
    {
      code: "export class data_store {}",
      errors: [renameError("data_store", "DataStore", "export class DataStore {}")],
    },
    {
      code: "export interface http_response { status: number }",
      errors: [
        renameError(
          "http_response",
          "HttpResponse",
          "export interface HttpResponse { status: number }",
        ),
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
        renameError(
          "user_id",
          "UserId",
          "type UserId = string;\nfunction f(id: UserId): UserId[] {\n  return [id];\n}",
        ),
      ],
    },

    // renames a class's references to itself from inside its body
    {
      code: "class data_store {\n  static create(): data_store {\n    return new data_store();\n  }\n}",
      errors: [
        renameError(
          "data_store",
          "DataStore",
          "class DataStore {\n  static create(): DataStore {\n    return new DataStore();\n  }\n}",
        ),
      ],
    },

    // keeps the key of a shorthand property, so the object keeps its shape
    {
      code: "class data_store {}\nconst registry = { data_store };",
      errors: [
        renameError(
          "data_store",
          "DataStore",
          "class DataStore {}\nconst registry = { data_store: DataStore };",
        ),
      ],
    },

    // only suggests renaming a merged interface in a script
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
