# eslint-plugin-explicit-types

TypeScript style rules for [ESLint](https://eslint.org) and
[Oxlint](https://oxc.rs/docs/guide/usage/linter). Types should get written out,
not derived.

## Setup

Requires Node.js 22+ or Bun 1.3.13+.

```sh
npm install --save-dev @cunarist/eslint-plugin-explicit-types
```

One plugin, namespace `@cunarist/explicit-types`, so every rule id reads
`@cunarist/explicit-types/<rule>`. The package's only export is the plugin
itself. Its flat configs sit at `plugin.configs`: one per preset, plus `all`
with every rule.

| Config     | Turns on                      |
| ---------- | ----------------------------- |
| `concrete` | write the type out            |
| `naming`   | names carry the contract      |
| `absence`  | one spelling for absence      |
| `all`      | every rule, new ones included |

### Oxlint, through Vite+

Oxlint loads the plugin through `jsPlugins` and turns on only the rules you
list, so spread a config's `rules`:

```ts
// vite.config.ts
import plugin from "@cunarist/eslint-plugin-explicit-types";
import { defineConfig } from "vite-plus";

export default defineConfig({
  lint: {
    jsPlugins: ["@cunarist/eslint-plugin-explicit-types"],
    rules: {
      ...plugin.configs.concrete.rules,
      // Or every rule: ...plugin.configs.all.rules,
      // Later keys win, so turn one off by id.
      "@cunarist/explicit-types/no-type-assertion": "off",
    },
  },
});
```

The same works in a plain `oxlint.config.ts`.

### ESLint

ESLint 9 flat config in TypeScript (needs `jiti` installed), with
`typescript-eslint`'s parser for TypeScript files:

```ts
// eslint.config.ts
import plugin from "@cunarist/eslint-plugin-explicit-types";
import tseslint from "typescript-eslint";

export default [
  { files: ["**/*.ts"], languageOptions: { parser: tseslint.parser } },
  plugin.configs.concrete,
  // Or every rule: plugin.configs.all,
  { rules: { "@cunarist/explicit-types/no-type-assertion": "off" } },
];
```

### Upgrading from the Deno plugin

This package replaces `jsr:@cunarist/deno-lint-plugin-explicit-types`. That was
three plugins, so the rule ids change: `explicit-concrete/no-keyof`,
`explicit-naming/no-enum`, and `explicit-absence/no-undefined-type` are now all
`@cunarist/explicit-types/<rule>`. The rule names after the slash are unchanged.

## `concrete` — write the type out

A type is written, not computed. If a reader has to run the compiler in their
head to know what a value is, that's a defect.

```ts
// BAD - go read TaskSnapshot and apply two transforms
type Draft = Partial<Omit<TaskSnapshot, "id">>;

// GOOD
interface Draft {
  label: string | null;
  state: TaskState | null;
}
```

`as const` and `satisfies` are allowed — both narrow rather than overrule.
Indexed access is too: `Options["retries"]` is how you name a type a library
already wrote.

## `naming` — names carry the contract

```ts
// BAD
enum Status {
  Pending,
  Done,
}

// GOOD
type Status = "PENDING" | "DONE";
```

These interlock: `no-enum` removes the construct, `upper-snake-string-unions`
governs the union that replaces it, and `no-upper-snake-object-keys` keeps those
members out of object keys. So turning a `Status` into a value is a `switch`,
not an object you index into — and a `switch` stops compiling the day someone
adds a member.

## `absence` — absence is authored

`undefined` is what the language hands back when nobody said anything. `null` is
what somebody wrote. Give absence one spelling per position, and never two at
once. `?` is a good spelling — these rules keep it, they just stop it doubling
up with the `undefined` keyword or with `| null`.

```ts
// BAD
interface StoredSettings {
  apiKey?: string | null; // no-optional-null - two ways to be empty
  zoomLevel: number | undefined; // no-undefined-type
}

// GOOD - `?` on a member, `| null` where `?` cannot go
interface StoredSettings {
  apiKey?: string;
  zoomLevel: number | null;
}
```

`?` is the undefined type, so there is no reason to write the keyword as well.
And a value that can be empty in two ways has no definite empty value. A member
or parameter says absence with `?`; a return type or variable, which cannot take
`?`, says it with `| null`; nothing says it twice:

```ts
interface Job {
  cursor?: string;
} // GOOD
function render(host?: Element): void {} // GOOD
function findNote(id: string): Note | null {} // GOOD

function open(path?: string | null): void {} // BAD - pick one
function open(path?: string | undefined): void {} // BAD - `?` already said it
```

One caveat before adopting: a key missing from JSON is `undefined` at runtime,
not `null`, so returning `| null` means normalising where you parse data.

## Rules

<!-- prettier-ignore-start -->
<!-- begin auto-generated rules list -->

💼 [Configurations](https://github.com/cunarist/eslint-plugin-explicit-types#setup) enabled in.\
🫙 Set in the `absence` [configuration](https://github.com/cunarist/eslint-plugin-explicit-types#setup).\
🧱 Set in the `concrete` [configuration](https://github.com/cunarist/eslint-plugin-explicit-types#setup).\
🔤 Set in the `naming` [configuration](https://github.com/cunarist/eslint-plugin-explicit-types#setup).

| Name                                                                   | Description                                                               | 💼 |
| :--------------------------------------------------------------------- | :------------------------------------------------------------------------ | :- |
| [camelcase](docs/rules/camelcase.md)                                   | Enforce camelCase, PascalCase, or UPPER_SNAKE_CASE for declared names     | 🔤 |
| [no-conditional-types](docs/rules/no-conditional-types.md)             | Disallow conditional types and the `infer` keyword                        | 🧱 |
| [no-enum](docs/rules/no-enum.md)                                       | Disallow `enum` declarations                                              | 🔤 |
| [no-index-signatures](docs/rules/no-index-signatures.md)               | Disallow index signatures                                                 | 🧱 |
| [no-inline-object-types](docs/rules/no-inline-object-types.md)         | Disallow inline object type literals                                      | 🧱 |
| [no-keyof](docs/rules/no-keyof.md)                                     | Disallow the `keyof` type operator                                        | 🧱 |
| [no-mapped-types](docs/rules/no-mapped-types.md)                       | Disallow mapped types                                                     | 🧱 |
| [no-optional-null](docs/rules/no-optional-null.md)                     | Disallow combining an optional `?` with `\| null`                         | 🫙 |
| [no-type-assertion](docs/rules/no-type-assertion.md)                   | Disallow type assertions other than `as const`                            | 🧱 |
| [no-typeof-type](docs/rules/no-typeof-type.md)                         | Disallow `typeof` in type positions                                       | 🧱 |
| [no-undefined-type](docs/rules/no-undefined-type.md)                   | Disallow the `undefined` keyword in type positions                        | 🫙 |
| [no-upper-snake-object-keys](docs/rules/no-upper-snake-object-keys.md) | Disallow UPPER_SNAKE_CASE object keys and type members                    | 🔤 |
| [no-utility-types](docs/rules/no-utility-types.md)                     | Disallow the built-in TypeScript utility types                            | 🧱 |
| [pascal-case-types](docs/rules/pascal-case-types.md)                   | Enforce PascalCase names for classes, interfaces, type aliases, and enums | 🔤 |
| [require-return-type](docs/rules/require-return-type.md)               | Require explicit return types on named functions                          | 🧱 |
| [upper-snake-string-unions](docs/rules/upper-snake-string-unions.md)   | Enforce UPPER_SNAKE_CASE for string literal union members                 | 🔤 |

<!-- end auto-generated rules list -->
<!-- prettier-ignore-end -->

## How opinionated is this?

Mainstream: `pascal-case-types`, `no-enum`, `no-type-assertion`,
`no-index-signatures`.

Deliberately stronger than most TypeScript codebases: `no-utility-types`,
`no-keyof`, `no-mapped-types`, `no-typeof-type`, `no-conditional-types`,
`no-inline-object-types`. These push toward types that are declared rather than
computed — closer to writing every struct out, as Go does. What you read is what
the type is.

Strongest of all: `absence`. It is the only preset that changes runtime code
rather than annotations.

## Pairs well with

`no-explicit-any` and `no-non-null-assertion` — built into Oxlint under
`typescript/`, and in `typescript-eslint` for ESLint. This plugin leaves them alone rather than
duplicating them.

## Known limits

- **No rule options.** Every rule is on or off; none takes settings.
- **One file at a time.** No cross-file resolution, so `no-utility-types` sees
  `Partial<T>` where it is written but not through a local alias.
- **Syntax, not types.** `no-type-assertion` sees `x as T`, not an assertion
  laundered through a function signature.
- **Names you didn't choose are left alone.** `no-upper-snake-object-keys` only
  reports UPPER_SNAKE_CASE, so custom element tags, `data-*` attributes, HTTP
  headers and library keymaps pass. Unquoted `snake_case` keys are
  `camelcase`'s job, and only where this code declares them.

## License

MIT.
