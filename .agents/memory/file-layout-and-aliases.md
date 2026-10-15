---
description: Kebab-case files named after rule ids, index.ts entries, colocated unit tests, regression tests in tests/, # subpath imports
---

**Everything under `src/` is named in kebab-case**, so a file name is the rule
id it implements — `no-utility-types` is in `no-utility-types.ts`, tested in
`no-utility-types.test.ts`, and documented in `docs/rules/no-utility-types.md`
(the ESLint plugin convention, which `meta.docs.url` links to). No translation
step sits between the diagnostic a user sees and the file they open.

    src/index.ts                         the plugin and its configs
    src/concrete/index.ts                the preset's rule map
    src/concrete/no-utility-types.ts
    src/concrete/no-utility-types.test.ts
    docs/rules/no-utility-types.md       the rule's docs page
    tests/configs.test.ts                a regression test

Every directory's entry file is `index.ts`, the Node convention. `src/index.ts`
is the only package entry; a preset's `index.ts` exports its rule `Map` and
nothing else. Tests sit beside the rule: the package publishes only `dist/`, so
colocation costs nothing in the tarball, and Vitest's default include finds
`*.test.ts` without config.

**Unit tests sit next to the code as `*.test.ts`; regression and integration
tests go in the top-level `tests/` folder** and use only the public entry, the
plugin's default export, imported as `#plugin` (`./src/index.ts`). CI runs them
with `vp test tests`, since the other test steps filter by rule tester.

**Shared code is imported through `#` subpath imports**, never a relative path
out of a directory:

```ts
import { typeNameTail } from "#helpers";
import { spanOf, testRule } from "#testing";
```

The aliases are `package.json` `imports`, which Node, TypeScript, Vite, and
Oxlint's plugin loader all resolve natively, so the source runs unbuilt. They
point at `.ts` files and never reach consumers: `vp pack` inlines them.
`#testing` is kept apart from `#helpers` so neither tester lands in a bundle.
`#package` is `package.json`, so the plugin reads its own name and version
without a parent-relative import, which `import/no-relative-parent-imports`
rejects.
