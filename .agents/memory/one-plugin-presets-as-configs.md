---
description: One plugin, namespace @cunarist/explicit-types; Deno's three plugins survive as flat configs
---

ESLint's convention is one plugin per package, named from the package:
`@cunarist/eslint-plugin-explicit-types` becomes the namespace
`@cunarist/explicit-types`. Oxlint normalizes `meta.name` the same way
(verified), so a rule id is `@cunarist/explicit-types/no-keyof` under both.

The Deno package was three plugins — `explicit-concrete`, `explicit-naming`,
`explicit-absence` — because Deno's plugin API had no presets. Those survive as
flat configs: `concreteConfig`, `namingConfig`, `absenceConfig`, and
`recommendedConfig` for all three, exported by name and on `plugin.configs`.
ESLint users list a config; Oxlint, whose plugins have no `configs` and turn no
rule on by themselves, spreads a config's `rules` next to
`jsPlugins: ["@cunarist/eslint-plugin-explicit-types"]`.

**No rule takes settings.** None has needed one. Where memona hardcoded a
project denylist (the `EventTarget` ban in `restricted-types`), the rule is
dropped rather than shipped as an option.
