---
description: One plugin, namespace @cunarist/explicit-types, default export only; Deno's three plugins survive as plugin.configs, plus all
---

ESLint's convention is one plugin per package, named from the package:
`@cunarist/eslint-plugin-explicit-types` becomes the namespace
`@cunarist/explicit-types`. Oxlint normalizes `meta.name` the same way
(verified), so a rule id is `@cunarist/explicit-types/no-keyof` under both.

The Deno package was three plugins — `explicit-concrete`, `explicit-naming`,
`explicit-absence` — because Deno's plugin API had no presets. Those survive as
flat configs at `plugin.configs.concrete`, `.naming` and `.absence`, plus
`.all` with every rule. `all` is built from the full rule map, so a new rule
joins it without an edit; `tests/configs.test.ts` checks it equals the union of
the three. There is no `recommended` and no `meta.docs.recommended`.
The package has only a default export, the plugin, as ESLint plugins do; no
named config exports. ESLint users list `plugin.configs.<name>`; Oxlint, whose
plugins have no `configs` and turn no rule on by themselves, spreads
`plugin.configs.<name>.rules` next to
`jsPlugins: ["@cunarist/eslint-plugin-explicit-types"]`.

**No rule takes settings.** None has needed one. Where memona hardcoded a
project denylist (the `EventTarget` ban in `restricted-types`), the rule is
dropped rather than shipped as an option.
