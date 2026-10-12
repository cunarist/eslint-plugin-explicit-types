---
description: The disciplined preset, no-unknown, no-satisfies, and the EventTarget ban were dropped on purpose
---

- **The whole `disciplined` preset**, dropped after it was built: `no-readonly`,
  `no-undefined-return`, `no-default-export`, `no-namespace-import`,
  `no-parameter-destructuring`, `no-private-modifier`, `no-line-lint-ignore`.
  These are conventions about how code is arranged, not about whether a type is
  written out — a different plugin's job. The implementations, docs, and 68
  tests are **gone**: history was squashed to a single commit afterwards, so
  they survive in no branch and no clone. Wanting them back means writing them
  again from memona's `restricted-types` and `coding-standards.md`. The rule
  names above are the whole inventory; the non-obvious parts of the work are
  kept as environment facts below. One of the seven has since come back in a
  wider form: `no-undefined-return` is superseded by the `absence` preset's
  `no-undefined-type`, which covers every type position rather than only
  returns.
- `no-unknown` — dropped after it shipped; see above.
- `no-satisfies` — also dropped after it shipped. It was banned for leaving the
  declaration's own type inferred, and the doc claimed an annotation plus
  `as const` recovered what it offered. Checked: it does not. An annotation
  widens the declaration to the named type, so `a.typo` compiles against an
  index signature; `as const` keeps the literal shape but checks nothing. Only
  `satisfies` does both, and it writes the constraint at the site rather than
  deriving it, which is what the through-line asks for.
- The `EventTarget` ban from memona's `restricted-types` — a memona-specific
  architectural rule, and unconfigurable here.
- `no-any` and non-null-assertion bans — Oxlint already ships
  `typescript/no-explicit-any` and `typescript/no-non-null-assertion`.
  Recommend those in the README instead of
  duplicating them.
- Anything Lit-specific — that is `deno-lint-plugin-lit`'s job.
