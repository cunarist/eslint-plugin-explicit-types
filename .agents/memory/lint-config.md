---
description: Lint config shape and exceptions model; every category but nursery on, plugins via `all`, offs in configs.project, per-file exceptions only in projectOverrides, ignorePatterns only for generated output
---

User policy, 2026-10-19 (blacklist, not whitelist). `vite.config.ts` names no
rule; it only wires these pieces together.

- **Categories:** `correctness`, `suspicious`, `pedantic`, `perf`, `style`,
  and `restriction` at `error`. `nursery` stays off (no line for it).
- **Plugins:** each enabled whole through its `all` config. Here that is the
  repo's own published plugin, linted from source:
  `explicitTypes.configs.all.rules`.
- **Blacklist:** `projectLint.configs.project.rules` in
  `scripts/project-lint.ts`, spread last in `rules`. It holds the repo's own
  `project/*` rules, repo-wide offs (each with a one-line reason: "collides
  with ...", "too much churn", "Node code"), and option tweaks. Never a
  hand-set `"error"` a category already turns on. New limits sit at the
  smallest value the code passed when they were set (`max-statements` 21,
  `max-params` 4, `import/max-dependencies` 18 for the rule registry).
- **Per-file exceptions:** only in `projectOverrides`, the whole `overrides`
  array exported from `scripts/project-lint.ts`. The Node code entry
  (`vite.config.ts`, `scripts/**`, rules `nodeRules`) comes first; any
  further entry needs a why-comment. Today there is none.
- **Banned:** `allowFiles`-style options in custom rules, and lint disable
  comments ([[lint-no-disable-comments]]).
- **`ignorePatterns`:** only generated or build output, never hand-written
  code. This repo has none (`dist/` and `node_modules/` are gitignored).
- **Precedence:** categories < `rules` (a later spread wins) < `overrides`
  (a later entry wins).
- Default limits stay (`max-lines` 300, `max-lines-per-function` 50, ...);
  refactor instead of raising them: split files, extract helpers, import a
  barrel, pass an options object.

```ts
// vite.config.ts
categories: { correctness: "error", suspicious: "error", pedantic: "error",
  perf: "error", style: "error", restriction: "error" },
rules: { ...explicitTypes.configs.all.rules, ...projectLint.configs.project.rules },
overrides: projectOverrides,

// scripts/project-lint.ts
export const projectOverrides: OxlintOverride[] = [
  { files: ["vite.config.ts", "scripts/**"], rules: nodeRules },
  // Why this file needs it.
  // { files: ["src/x.ts"], rules: { "some-rule": "off" } },
];
```
