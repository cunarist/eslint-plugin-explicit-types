---
description: What this repo's Deno lint ran (tags, include list, modules); the mapping is in PR 1; three eslint-plugin-import-structure rules wait for the npm plugin
---

This repo's own Deno lint setup, which `configs.project` in
`scripts/project-lint.ts` must keep covering ([[lint-parity-never-shrinks]]):
the `recommended` and `jsr` tags, the include list (`camelcase`, `eqeqeq`,
`guard-for-in`, `no-console`, `no-const-assign`, `no-eval`,
`no-non-null-asserted-optional-chain`, `no-non-null-assertion`,
`no-throw-literal`, `verbatim-module-syntax`), this package's rules, and
`@cunarist/deno-import-check`.

The rule-by-rule table for all 97 Deno rules is in the porting PR,
cunarist/eslint-plugin-explicit-types#1. The kinds of mapping are summarized
in [[lint-parity-never-shrinks]]. `camelcase` became `id-match`
([[naming-id-match]]). `maxWarnings: 0` keeps Deno's rule that every
diagnostic fails.

**Pending, not accepted:** the import-structure plugin's `prefer-alias-import`,
`no-barrel-bypass`, and `no-relative-bypass` have no equivalent here yet. They
come back when `eslint-plugin-import-structure` is published and this
repo adds it to `jsPlugins` with its config. The rest of import-structure is
covered: `no-self-import`, `no-absolute-import`, and `no-parent-import` map to
`import/*` rules, and `import/no-cycle` replaces its CLI's cycle check.

The rule list lives in `configs.project`. `vite.config.ts` only spreads it, a
user decision: no rule is listed by name there. Before removing a line from
it, find what else covers it.
