---
description: Rules use ESLint's create API, typed ExplicitRule, with every visitor node parameter annotated by hand
---

Rules are plain ESLint rules: `meta` plus `create(context)`, never Oxlint's
`createOnce`, and the built code imports no package. A rule is typed
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

The public `.d.ts` imports `ConfigObject` and `Plugin` from `@eslint/core`,
so `@eslint/core` is a real runtime dependency in `dependencies`, installed
with the plugin, even though `dist/index.js` does not import it
([[package-json-shape]]).

Messages and `messageId` follow [[plugin-messages-and-fixes]]; tests follow
[[plugin-dual-ruletester]].
