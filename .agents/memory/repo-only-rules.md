---
description: Published plugin = the Deno plugin's 15 rules exactly; repo-only rules (camelcase) live in scripts/project-lint.ts
---

The user decided the published plugin contains exactly the 15 rules of
`cunarist/deno-lint-plugin-explicit-types`, nothing added or removed.
`tests/configs.test.ts` pins that list.

A rule this repo needs only for its own lint parity goes in
`scripts/project-lint.ts`: a repo-local plugin, `meta.name` `project`, loaded in
`vite.config.ts` `jsPlugins` and turned on as `project/<rule>`. Its
`configs.project` is the repo's whole rule list beyond `configs.all`: Deno
parity, extras, pedantic opt-outs and per-rule options, built-in Oxlint ids
included. `vite.config.ts` spreads it and names no rule itself; only the
`overrides` entry, a file glob, stays there. Today it holds
`camelcase`, a port of Deno's built-in rule (Oxlint has none). It may import
`#helpers`; its test, `scripts/project-lint.test.ts`, runs under both testers
through `#testing`.

One file holds rule and plugin, rather than `scripts/rules/camelcase.ts`, because
there is one rule and the repo's every-directory-has-`index.ts` convention
would otherwise add two entry files for it. Split it once a second rule lands.

`scripts/` never ships: `files` is `["dist"]` and `vp pack` builds only
`src/index.ts`, which never imports from `scripts/`.
