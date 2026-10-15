# @cunarist/explicit-types/camelcase

📝 Enforce camelCase, PascalCase, or UPPER_SNAKE_CASE for declared names.

💼 This rule is enabled in the 🔤 `naming` [config](https://github.com/cunarist/eslint-plugin-explicit-types#setup).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

## Rule Details

A `snake_case` name the code declares is reported. This ports Deno's built-in
[`camelcase`](https://docs.deno.com/lint/rules/camelcase), with the same
identifiers, and reports them with ESLint's `camelcase` message.

One casing per kind of name is what lets the other `naming` rules mean
something: PascalCase says type, UPPER_SNAKE_CASE says constant or union member,
and camelCase says everything else. A `snake_case` name fits none of them, so it
reads as a foreign vocabulary even when nobody outside chose it.

The rule only judges names this code declares. A name it merely uses — a call to
`do_something()`, a read of `row.created_at`, a key pulled out with
`const { created_at } = row` — belongs to someone else and passes. When a
declared key really has to be `snake_case`, say for a database row, quoting it
makes that explicit: `{ "created_at": now }`.

- Leading and trailing underscores are ignored. A name passes when what is left
  has no `_` or is all uppercase, so `_private`, `trailing_`, and `SHA3_224`
  pass and `Sha3_224` fires.
- Checked: variables (every name in a destructuring pattern), function and class
  declarations, a function or class expression assigned straight to a variable,
  parameters of functions, methods, constructors, and class setters, import
  aliases, default and namespace imports, `export * as name`, type aliases,
  interfaces, namespaces, enums and enum members, and unquoted keys of an object
  literal assigned straight to a variable or of an interface or type literal,
  nested type literals included.
- Skipped, as Deno skips them: a shorthand `const { snake_key } = obj`,
  `import { snake_name }` without `as`, computed and quoted object literal keys,
  member access and calls, and everything under a `declare` modifier.
- Deno's AST differs from ESTree in places, and the rule follows Deno's. So it
  also skips arrow function, `catch`, object-literal setter, and constructor
  parameter-property parameters; type parameters; class property and method
  names; a default-exported function or class name; nested object literals;
  and an initializer wrapped in parentheses or `as`, such as
  `const x = ({ a_b: 1 })`. A computed interface key like `[foo_bar]: string`
  is checked.
- Deno's renaming hint becomes an editor suggestion instead: renaming a
  declared name throughout the file, PascalCase for classes, types, namespaces,
  and enums and camelCase otherwise, or quoting a key. Enum members get no
  rename suggestion. The report covers only the name, never a `?` or type
  annotation after it.
- [`pascal-case-types`](pascal-case-types.md) overlaps on type names but is
  stricter: it rejects `_Internal` and `HTTP_STATUS`, which this rule lets through
  as leading-underscore and all-uppercase names.

Examples of **incorrect** code for this rule:

```ts
let first_name = "Ichigo";
const obj = { last_name: "Hoshimiya" };
function do_something() {}
function load({ snake_case = "default" }) {}
class snake_case_class {}
type snake_case_type = { some_property: number };
enum Status {
  in_progress,
}
```

Examples of **correct** code for this rule:

```ts
let firstName = "Ichigo";
const FIRST_NAME = "Ichigo";
const __private = "Hoshimiya";
const row = loadRow();
const { last_name } = row;
do_something();
function load({ snake_case: camelCase = "default" }) {}
class PascalCaseClass {}
import { not_camel_cased } from "./module.ts";
```

## When Not To Use It

If the code declares many names in a foreign `snake_case` vocabulary, such as
database rows or API payloads typed by hand, and quoting every key is not
worth it, turn this rule off. Names that are only used, never declared, already
pass.
