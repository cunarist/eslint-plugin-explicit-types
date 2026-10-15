At the start of every new session, run `damem recall` in the terminal and treat
its output as the context for this repository. If the `damem` command is not
found, read [INSTALL.md](https://github.com/cunarist/damem/blob/main/INSTALL.md)
and follow it before reasoning or responding.

# AGENTS.md

## Project

- **@cunarist/eslint-plugin-explicit-types**: TypeScript style rules that keep
  types written out rather than derived. One ESLint plugin that also runs under
  Oxlint. Namespace `@cunarist/explicit-types`, 16 rules in three presets
  (`concrete`, `naming`, `absence`).
- Node.js 24+ and Vite+ (`vp`): Oxlint, Oxfmt, type checking, Vitest, tsdown.
- Ported from the Deno plugin `jsr:@cunarist/deno-lint-plugin-explicit-types`.

## Rules

- `vp check`, `vp test`, and `vp pack` must all pass. `vp check --fix` formats.
- The only config files are `package.json`, `tsconfig.json`, and
  `vite.config.ts`, plus `package-lock.json`. Only `.ts` source files, configs
  included; there are no `.js`, `.mjs`, `.cjs`, `.jsx`, or `.tsx` files.
- Every directory's entry file is `index.ts`. Files under `src/` are kebab-case,
  named after the rule id: `no-keyof.ts`, `no-keyof.md`, `no-keyof.test.ts`.
- Shared code comes through `#helpers`, `#testing`, and `#package`, never a
  relative path out of a directory.
- Rules use ESLint's standard `create` API, typed `ExplicitRule`, with every
  visitor's node parameter annotated. No runtime dependencies.
- Every rule test runs under both ESLint's and Oxlint's `RuleTester` through
  `testRule`. Write cases once, in ESLint's shape and 1-based columns.
- The repo lints itself with its own rules. Never add an `oxlint-disable` or
  `eslint-disable`; fix the source.
- Lint coverage never drops below what Deno enforced. Check
  `lint-parity-with-deno` before removing anything from `vite.config.ts`.
- Every rule has a `docs/rules/<rule>.md` in the ESLint core layout: Rule
  Details, incorrect/correct examples, and When Not To Use It.
- Only CI publishes, from a published GitHub release `vX.Y.Z` that matches
  `package.json`. Use the `release` skill and ask the user first.
