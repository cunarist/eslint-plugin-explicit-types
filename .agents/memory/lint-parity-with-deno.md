---
description: vite.config.ts must keep every lint check Deno ran; camelcase is project/camelcase; three import-check rules are open gaps
---

The user requires lint coverage never to shrink below the Deno setup:
`recommended` and `jsr` tags, the include list (`camelcase`, `eqeqeq`,
`guard-for-in`, `no-console`, `no-const-assign`, `no-eval`,
`no-non-null-asserted-optional-chain`, `no-non-null-assertion`,
`no-throw-literal`, `verbatim-module-syntax`), this package's rules, and
`@cunarist/deno-import-check`. Formatting may change.

The rule-by-rule table is in the porting PR,
cunarist/eslint-plugin-explicit-types#1. In short, each of the 97 Deno rules is
one of:

- the same rule in `vite.config.ts`, set to `error`;
- a renamed equivalent (`no-new-symbol` → `no-new-native-nonconstructor`,
  `no-window` → `no-restricted-globals: window`, `ban-untagged-ignore` →
  `unicorn/no-abusive-eslint-disable`, `ban-unused-ignore` and
  `ban-unknown-rule-code` → `options.reportUnusedDisableDirectives`);
- caught by the parser or `typeCheck` (`no-dupe-args`, `no-octal`,
  `no-await-in-sync-fn`, `no-import-assertions` TS2880, `no-sloppy-imports`
  TS2835, `verbatim-module-syntax` TS1484);
- `no-slow-types`: `isolatedDeclarations`, enforced by `vp pack` (TS9010), not
  `vp check`;
- vacuous: JSX rules (no `.tsx` exists) and Deno-only rules.

`maxWarnings: 0` keeps Deno's every-diagnostic-fails behaviour.

`camelcase`, which Oxlint lacks, is `project/camelcase` from the repo-only
plugin `scripts/project-lint.ts` (see [[repo-only-rules]]).

Open gaps, not decisions: `import-check`'s `prefer-alias-import`,
`no-barrel-bypass`, and `no-relative-bypass`. Its `no-self-import`,
`no-absolute-import`, and `no-parent-import` map to `import/*` rules, and
`import/no-cycle` stands in for its CLI's cycle check.

Before removing a line from `vite.config.ts`, find what else covers it.
