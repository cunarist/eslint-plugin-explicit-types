# eslint-plugin-explicit-types

TypeScript style rules for both [ESLint](https://eslint.org) and [Oxlint](https://oxc.rs/docs/guide/usage/linter): types get written out, not derived.\
Install with `npm install --save-dev @cunarist/eslint-plugin-explicit-types`. Requires Node.js 22.18+.

```ts
// Oxlint, through Vite+: vite.config.ts
import plugin from "@cunarist/eslint-plugin-explicit-types";
import { defineConfig } from "vite-plus";
const rules = { ...plugin.configs.concrete.rules };
export default defineConfig({
  lint: { jsPlugins: ["@cunarist/eslint-plugin-explicit-types"], rules },
});
```

```ts
// ESLint 9: eslint.config.ts (loading a .ts config needs jiti)
import plugin from "@cunarist/eslint-plugin-explicit-types";
import { parser } from "typescript-eslint";
const ts = { files: ["**/*.ts"], languageOptions: { parser } };
export default [ts, plugin.configs.concrete];
```

## Configs and rules

- `concrete`: write the type out instead of computing it.
- `naming`: names carry the contract, e.g. string unions instead of enums.
- `absence`: one spelling for absence, `?` or `| null`, never both.
- `all`: every rule, including ones added later. Rules take no options.

<!-- prettier-ignore-start -->
<!-- begin auto-generated rules list -->

💼 [Configurations](https://github.com/cunarist/eslint-plugin-explicit-types#configs-and-rules) enabled in.\
🫙 Set in the `absence` [configuration](https://github.com/cunarist/eslint-plugin-explicit-types#configs-and-rules).\
🧱 Set in the `concrete` [configuration](https://github.com/cunarist/eslint-plugin-explicit-types#configs-and-rules).\
🔤 Set in the `naming` [configuration](https://github.com/cunarist/eslint-plugin-explicit-types#configs-and-rules).

| Name                                                                   | Description                                                               | 💼 |
| :--------------------------------------------------------------------- | :------------------------------------------------------------------------ | :- |
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
| [single-capital-type-params](docs/rules/single-capital-type-params.md) | Require type parameters to be named with a single capital letter          | 🔤 |
| [upper-snake-string-unions](docs/rules/upper-snake-string-unions.md)   | Enforce UPPER_SNAKE_CASE for string literal union members                 | 🔤 |

<!-- end auto-generated rules list -->
<!-- prettier-ignore-end -->

License: MIT.
