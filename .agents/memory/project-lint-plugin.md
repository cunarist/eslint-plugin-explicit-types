---
description: scripts/project-lint.ts is the repo-local plugin "project" holding the repo's rule list (typed DummyRuleMap); its own rules sit in flat scripts/project-lint-*.ts files; never published, no tests
---

Every repo has `scripts/project-lint.ts`, copied from
`cunarist/eslint-plugin-explicit-types` and extended. It is a repo-local
Oxlint plugin with `meta.name` `"project"`, loaded through `jsPlugins` in
`vite.config.ts`. It holds:

- **`configs.project.rules`**: the repo's own `project/*` rules, repo-wide
  offs (each with a one-line why), and option tweaks; never a rule a
  category already turns on. See [[lint-config]].
- **Custom rules**, enabled as `project/<rule>`: here
  `no-disable-comments`, `prefer-ascii`, `no-asset-imports`
  ([[ts-only-files-and-imports]]), and the hugoalh ports (`no-nan`,
  `no-modifier-private`, ...) copied from eslint-plugin-import-structure.

Files stay under Oxlint's default `max-lines` of 300 (2026-10-16), so the
plugin is split into flat themed files sharing the prefix; `scripts/` has no
subfolders and no `index.ts`:

| File                                    | Holds                                   |
| --------------------------------------- | --------------------------------------- |
| `scripts/project-lint.ts`               | the plugin object and `configs.project` |
| `scripts/project-lint-types.ts`         | `ProjectRule` and the shared rule types |
| `scripts/project-lint-source.ts`        | `no-disable-comments`, `prefer-ascii`   |
| `scripts/project-lint-hugoalh.ts`       | hugoalh ports on expressions/statements |
| `scripts/project-lint-hugoalh-types.ts` | hugoalh ports on types and classes      |
| `scripts/project-lint-modules.ts`       | `no-asset-imports`                      |

```ts
import type { DummyRuleMap } from "vite-plus/lint";

const rules: DummyRuleMap = {
  "id-match": ["error", "^_*[^_]*_*$|^[^a-z]*$", {/* ... */}],
  curly: "error",
  "project/no-disable-comments": "error",
  "project/no-asset-imports": "error",
};

const plugin = {
  meta: { name: "project" },
  rules: { "no-disable-comments": noDisableCommentsRule, "no-asset-imports": noAssetImportsRule },
  configs: { project: { rules } },
};
export default plugin;
```

## Why `DummyRuleMap` and an unannotated plugin (decided 2026-10-15)

- `DummyRuleMap` (re-exported by `vite-plus/lint`) is Oxlint's type for
  `OxlintConfig.rules`. Despite the name it lists every built-in rule with its
  options, so a typo in a rule id or option is a type error, not just a CI
  failure. Without it, TypeScript widens `"error"` to `string`; `as const`
  doesn't help because Oxlint wants mutable tuples.
- `@eslint/core`'s `Plugin` is too loose to read back: `configs` is optional,
  any key may be missing, and a config may be an array, so
  `projectLint.configs.project.rules` fails in `vite.config.ts` (and `!` is
  banned). Optional chaining still leaves the array case.
- Oxlint's own `Plugin` type (`vite-plus/lint/plugins`) has no `configs`.
- Two hand-written interfaces worked but were dropped as noise; a plain
  config object was rejected because custom rules need the plugin form anyway
  and every repo should look the same.

`scripts/` is tooling, not production code: never packed or published, and
no tests. Node code rules for `scripts/**` and `vite.config.ts` are the first
entry of `projectOverrides`; see [[lint-config]].
