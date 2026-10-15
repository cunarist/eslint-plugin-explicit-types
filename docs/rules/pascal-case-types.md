# @cunarist/explicit-types/pascal-case-types

📝 Enforce PascalCase names for classes, interfaces, type aliases, and enums.

💼 This rule is enabled in the 🔤 `naming` [config](https://github.com/cunarist/eslint-plugin-explicit-types#setup).

<!-- end auto-generated rule header -->

## Rule Details

Names must match `/^[A-Z][A-Za-z0-9]*$/`: an uppercase first letter and no
underscores.

TypeScript puts types and values in separate namespaces but writes them with the
same identifier syntax. At a use site, `const x: user_profile = load();` gives
the reader nothing to distinguish the annotation from a variable that happens to
appear after a colon, and `payload_type.parse(input)` could be a class, a module
object, or a plain record. Casing is the only cue available without opening the
declaration. Reserving PascalCase for things that name a type, and leaving
`camelCase` to values and `UPPER_SNAKE_CASE` to constants, makes that cue
mechanical: the shape of the identifier tells you which namespace it came from,
so you never have to resolve it to find out.

- Anonymous class expressions are skipped — `export default class {}` has no
  `id` to check.
- Class expressions with a name are checked: `const C = class my_class {};`
  fires on `my_class`.
- Underscores are rejected anywhere in the name, not only at the start.
  `User_Profile` fires even though it begins uppercase.
- A leading digit or lowercase letter fires; digits elsewhere are fine, so
  `Base64Encoder` and `Http2Stream` pass.
- Enum names are checked here even though [`no-enum`](no-enum.md) rejects `enum`
  outright. The overlap is deliberate: the two rules are separately excludable,
  so someone can enable the `naming` preset while turning off
  `@cunarist/explicit-types/no-enum` and keep enums. When they do, those enum names
  should still be PascalCase.
- Only declaration names are checked. Uses of a badly-named type imported from
  another module are not reported — there is no cross-file resolution.
- Type parameters, variables, functions, and properties are out of scope. The
  value side was Deno's built-in `camelcase`; Oxlint ships no equivalent, and
  restoring one is an open follow-up.

Examples of **incorrect** code for this rule:

```ts
type user_profile = { id: string };
interface http_response {
  status: number;
}
class dataStore {}
```

Examples of **correct** code for this rule:

```ts
type UserProfile = { id: string };
interface HttpResponse {
  status: number;
}
class DataStore {}
```

## When Not To Use It

If your codebase names types some other way — with a prefix and underscore, for
instance — this rule rejects any underscore in the name. Turn it off if
PascalCase for type declarations is not your convention.
