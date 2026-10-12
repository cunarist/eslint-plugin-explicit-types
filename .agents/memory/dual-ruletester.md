---
description: Every rule test runs under both ESLint's and Oxlint's RuleTester, written once in ESLint's shape
---

`testRule` in `#testing` runs each case twice, in Vitest: under ESLint's
`RuleTester` with `@typescript-eslint/parser` and a `.ts` filename, and under
Oxlint's (`vite-plus/lint/plugins-dev`). No ESLint config file is involved.

Write cases in ESLint's shape. `spanOf(code, text)` gives ESLint's 1-based
columns; the harness subtracts one for Oxlint, which counts columns from 0.
Placeholder `data` must be strings, because Oxlint types it narrower than
ESLint.

The two type systems do not meet: `RuleDefinition` is not assignable to
Oxlint's `Rule` (`meta.docs` has no index signature, the `sourceCode` shapes
differ), though Oxlint runs ESLint rules unchanged. The harness widens Oxlint's
`run` parameter in one documented interface, `OxlintRunner`; the Oxlint half of
every test proves the runtime agrees.

CI runs `vp test -t " eslint "` and `vp test -t " oxlint "` as separate steps,
280 cases each, so a failure names its host. See [[rule-typing-explicitrule]].
