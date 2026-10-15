---
description: Rules use ESLint's create API, typed ExplicitRule, with every visitor node parameter annotated by hand
---

Rules are plain ESLint rules: `meta` plus `create(context)`, never Oxlint's
`createOnce`, and the package has no runtime dependencies. A rule is typed
`ExplicitRule` from `#helpers`: `@eslint/core`'s `RuleDefinition`, with
`TSESTree` nodes from `@typescript-eslint/types`, so `context.report` takes
TypeScript nodes.

ESLint's visitor type is loose, so every visitor annotates its node parameter
(`TSTypeOperator(node: TSESTree.TSTypeOperator): void`). Forget one and the
parameter is `any`; the type-aware `typescript/no-unsafe-*` rules in
`vite.config.ts` then fail. Verified by removing an annotation.

Why not the alternatives, all checked:

- `@typescript-eslint/utils`' `RuleModule` is assignable to neither ESLint's
  `RuleDefinition` nor Oxlint's `Rule` (its catch-all listener is
  `RuleFunction<never>`).
- Oxlint's `Rule` type would make the package depend on `@oxlint/plugins`.

The public `.d.ts` inlines the few `@eslint/core` types it needs; `vp pack`
reports that as "Detected dependencies in bundle", which `pack.deps.onlyBundle`
in `vite.config.ts` acknowledges.

Messages are one string, Deno's old `message` and `hint` joined, because ESLint
and Oxlint diagnostics have no hint field. Report with `messageId` and `data`
so tests can assert which message fired. See [[plugin-dual-ruletester]].
