---
description: concrete preset: ten rules that ban derived types; split from memona's restricted-types
---

17 rules in three presets: [[preset-concrete]], [[preset-naming]],
[[preset-absence]]. Src column: `mem` = ported from memona's plugin, `std` =
written in memona's `coding-standards.md` but never enforced, `new` = neither,
added here.

`restricted-types` was one mega-rule in memona; it is split here so each ban is
individually nameable and disableable.

| Rule                     | Src | Enforces                                                 |
| ------------------------ | --- | -------------------------------------------------------- |
| `no-utility-types`       | mem | No `Partial`/`Record`/`ReturnType`/… — 22 built-ins      |
| `no-keyof`               | mem | No `keyof` in a type position                            |
| `no-typeof-type`         | mem | No `typeof x` in a type position (`TSTypeQuery`)         |
| `no-mapped-types`        | mem | No `{ [K in T]: … }`                                     |
| `no-index-signatures`    | mem | No `{ [k: string]: … }` — use concrete fields or a `Map` |
| `no-inline-object-types` | new | No unnamed object shape in a type position               |
| `no-conditional-types`   | new | No `T extends U ? A : B`, no `infer`                     |
| `require-return-type`    | new | Named functions declare their return type                |
| `no-type-assertion`      | std | No `x as T` / `<T>x`; `as const` is allowed              |
| `no-satisfies`           | new | No `satisfies`; annotate the declaration (v0.7.0)        |
