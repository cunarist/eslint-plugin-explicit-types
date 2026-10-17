---
description: Every file is .ts (no js/mjs/cjs/jsx/tsx, configs included); imports are .ts or package .js/.mts/.mjs subpaths, never CSS/JSON/SVG/JSX/TSX or import attributes
---

The user's rule, from the Deno days and restated for Node (2026-10-12): "No
JS, not even JSX/TSX, only TS." Source, scripts, tests, and configs are all
plain `.ts`. Build output in a gitignored folder is the only JS.

`tsconfig.json`: no `allowJs`, no `jsx`, and exactly this strictness set
(user decision, 2026-10-18): `strict` (written out; TS 6 defaults to it, but
the flag stays explicit), `noUncheckedIndexedAccess`,
`noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `noUnusedLocals`,
`noUnusedParameters`, `noImplicitOverride`, `noFallthroughCasesInSwitch`,
`erasableSyntaxOnly`, plus the mechanical `verbatimModuleSyntax`,
`allowImportingTsExtensions`, and `noEmit` (packages also keep `declaration`
and `isolatedDeclarations`). `exactOptionalPropertyTypes` is off everywhere:
write `{ key: maybeUndefined }` rather than leaving the key out to please it.
If a tool or framework seems to need a JS or TSX file, stop and flag it
instead of adding one.

## No asset imports (2026-10-14, widened 2026-10-16 and 2026-10-17)

`project/no-asset-imports` (in `scripts/project-lint-modules.ts`, renamed
from `no-non-ts-imports` on 2026-10-16) fails:

- a relative, absolute, `#`, or package-subpath specifier whose last segment
  has an extension other than `.ts`, `.js`, `.mts`, or `.mjs`: `.css`,
  `.json`, `.svg`, `.jsx`, `.tsx`, and every other asset;
- any `?query` suffix (`?raw`, `?url`, `?inline`);
- any import attributes (`with { type: "json" }`, `with { type: "text" }`).

`.js`, `.mts`, and `.mjs` are allowed (user decision, 2026-10-17) for package
subpaths such as `lit/decorators.js` or `pdfjs-dist/legacy/build/pdf.mjs`;
this repo's own files are still `.ts` only. `.jsx` and `.tsx` stay banned.
Bare packages, `#` aliases, and `node:` builtins pass.

```ts
import data from "./scenes.json" with { type: "json" }; // no
import icon from "./lock.svg?raw"; // no
import { typeNameTail } from "#helpers"; // yes
```

## What to do instead

- **JSON data:** turn it into a `.ts` module exporting a typed constant.
- **`package.json` fields at runtime:** never `import pkg from
  "./package.json"` and there is no `#package` alias. Write the value out in
  `.ts` and add a test in `tests/` that reads `package.json` with `node:fs`
  and fails on drift (`meta.name`/`meta.version`, `tests/package-meta.test.ts`).
- **Reading a file is not importing it.** `readFileSync` + `JSON.parse` is
  fine in tooling and tests.
