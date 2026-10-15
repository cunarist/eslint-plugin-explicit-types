---
description: Published plugin = the Deno plugin's 15 rules exactly; repo-only rules live in scripts/project-lint.ts (none today; camelcase is id-match)
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
`overrides` entry, a file glob, stays there. It holds no custom rule today:
`rules` is `{}`, kept so `vite.config.ts` loads it in `jsPlugins` unchanged and
a future repo-only rule has a home. It may import `#helpers`. `scripts/` is
repo tooling, not production code: no tests.

It once held `camelcase`, a ~400-line port of `deno_lint`'s `camelcase.rs`. The
user replaced it with Oxlint's built-in `id-match` (see [[lint-parity-with-deno]]),
accepting no autofix. Keep rule and plugin in one file until a second rule
lands, rather than adding `scripts/rules/` and its `index.ts`.

`scripts/` never ships: `files` is `["dist"]` and `vp pack` builds only
`src/index.ts`, which never imports from `scripts/`.
