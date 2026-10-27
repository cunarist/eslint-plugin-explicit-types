# eslint-plugin-explicit-types

Someone adds one field to `User`, and every `Partial<User>` quietly changes
shape. The diff shows one line; the review shows nothing.

This plugin for [ESLint](https://eslint.org) and
[Oxlint](https://oxc.rs/docs/guide/usage/linter) asks for types written out,
not derived. The shape is readable right where it is used, and a change
upstream turns into a compile error exactly where it matters.

```ts
// Before: the reader runs the compiler in their head
type Draft = Partial<Article>;
function title(article: Article) {
  return article.title ?? null;
}

// After: the contract is on the page
interface Draft {
  title?: string;
  body?: string;
}
function title(article: Article): string | null {
  return article.title ?? null;
}
```

## Install

```sh
npm install --save-dev eslint-plugin-explicit-types
```

Requires Node.js 22.18+.

## Usage

ESLint 9 flat config, with
[typescript-eslint](https://typescript-eslint.io)'s parser (a `.ts` config
needs [jiti](https://github.com/unjs/jiti)):

```sh
npm install --save-dev eslint typescript-eslint jiti eslint-plugin-explicit-types
```

```ts
// eslint.config.ts
import plugin from "eslint-plugin-explicit-types";
import { parser } from "typescript-eslint";

export default [
  { files: ["**/*.ts"], languageOptions: { parser } },
  plugin.configs.concrete,
  plugin.configs.naming,
  plugin.configs.absence,
];
```

Oxlint, through [Vite+](https://viteplus.dev):

```ts
// vite.config.ts
import plugin from "eslint-plugin-explicit-types";
import { defineConfig } from "vite-plus";

export default defineConfig({
  lint: {
    jsPlugins: ["eslint-plugin-explicit-types"],
    rules: {
      ...plugin.configs.concrete.rules,
      ...plugin.configs.naming.rules,
      ...plugin.configs.absence.rules,
    },
  },
});
```

Rule ids use the `explicit-types/` prefix, e.g. `explicit-types/no-keyof`.
No rule takes options.

## Configs and rules

Each config turns its rules on as `"error"`. Mix them freely.

| Config     | Idea                                                           |
| :--------- | :------------------------------------------------------------- |
| `concrete` | Shapes you can read, not `Omit<Pick<...>>` puzzles to solve.   |
| `naming`   | Names carry the contract, e.g. string unions instead of enums. |
| `absence`  | One way to say "missing": `?` or `\| null`, never both.        |
| `all`      | Every rule, including ones added in later releases.            |

<!-- prettier-ignore-start -->
<!-- begin auto-generated rules list -->

💼 [Configurations](https://github.com/cunarist/eslint-plugin-explicit-types#configs-and-rules) enabled in.\
🫙 Set in the `absence` [configuration](https://github.com/cunarist/eslint-plugin-explicit-types#configs-and-rules).\
🧱 Set in the `concrete` [configuration](https://github.com/cunarist/eslint-plugin-explicit-types#configs-and-rules).\
🔤 Set in the `naming` [configuration](https://github.com/cunarist/eslint-plugin-explicit-types#configs-and-rules).\
🔧 Automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/user-guide/command-line-interface#--fix).\
💡 Manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

| Name                                                                   | Description                                                               | 💼 | 🔧 | 💡 |
| :--------------------------------------------------------------------- | :------------------------------------------------------------------------ | :- | :- | :- |
| [no-conditional-types](docs/rules/no-conditional-types.md)             | Disallow conditional types and the `infer` keyword                        | 🧱 |    |    |
| [no-enum](docs/rules/no-enum.md)                                       | Disallow `enum` declarations                                              | 🔤 | 🔧 | 💡 |
| [no-index-signatures](docs/rules/no-index-signatures.md)               | Disallow index signatures                                                 | 🧱 |    |    |
| [no-inline-object-types](docs/rules/no-inline-object-types.md)         | Disallow inline object type literals                                      | 🧱 |    | 💡 |
| [no-keyof](docs/rules/no-keyof.md)                                     | Disallow the `keyof` type operator                                        | 🧱 |    |    |
| [no-mapped-types](docs/rules/no-mapped-types.md)                       | Disallow mapped types                                                     | 🧱 |    | 💡 |
| [no-optional-null](docs/rules/no-optional-null.md)                     | Disallow combining an optional `?` with `\| null`                         | 🫙 |    | 💡 |
| [no-satisfies](docs/rules/no-satisfies.md)                             | Disallow the `satisfies` operator                                         | 🧱 |    |    |
| [no-type-assertion](docs/rules/no-type-assertion.md)                   | Disallow type assertions other than `as const`                            | 🧱 |    |    |
| [no-typeof-type](docs/rules/no-typeof-type.md)                         | Disallow `typeof` in type positions                                       | 🧱 |    |    |
| [no-undefined-type](docs/rules/no-undefined-type.md)                   | Disallow the `undefined` keyword in type positions                        | 🫙 | 🔧 | 💡 |
| [no-upper-snake-object-keys](docs/rules/no-upper-snake-object-keys.md) | Disallow UPPER_SNAKE_CASE object keys and type members                    | 🔤 |    |    |
| [no-utility-types](docs/rules/no-utility-types.md)                     | Disallow the built-in TypeScript utility types                            | 🧱 | 🔧 |    |
| [pascal-case-types](docs/rules/pascal-case-types.md)                   | Enforce PascalCase names for classes, interfaces, type aliases, and enums | 🔤 | 🔧 | 💡 |
| [require-return-type](docs/rules/require-return-type.md)               | Require explicit return types on named functions                          | 🧱 | 🔧 |    |
| [single-capital-type-params](docs/rules/single-capital-type-params.md) | Require type parameters to be named with a single capital letter          | 🔤 |    | 💡 |
| [upper-snake-string-unions](docs/rules/upper-snake-string-unions.md)   | Enforce UPPER_SNAKE_CASE for string literal union members                 | 🔤 |    | 💡 |

<!-- end auto-generated rules list -->
<!-- prettier-ignore-end -->

## License

MIT
