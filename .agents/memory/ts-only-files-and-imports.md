---
description: Every file is .ts (no js/mjs/cjs/jsx/tsx, configs included); imports are .ts or package .js subpaths, never CSS/JSON/SVG or import attributes
---

The user's rule, from the Deno days and restated for Node (2026-10-12): "No
JS, not even JSX/TSX, only TS." Source, scripts, tests, and configs are all
plain `.ts`. Build output in a gitignored folder is the only JS.

`tsconfig.json`: no `allowJs`, no `jsx`, and the template's strict flags
(`verbatimModuleSyntax`, `erasableSyntaxOnly`, `allowImportingTsExtensions`,
`isolatedDeclarations` in packages, `exactOptionalPropertyTypes`,
`noUncheckedIndexedAccess`). If a tool or framework seems to need a JS or TSX
file, stop and flag it instead of adding one.

## Only module imports (2026-10-14, widened 2026-10-16)

`project/no-asset-imports` (in `scripts/project-lint-modules.ts`, renamed
from `no-non-ts-imports` on 2026-10-16) fails:

- a relative, absolute, `#`, or package-subpath specifier whose last segment
  has an extension other than `.ts` or `.js`: `.css`, `.json`, `.svg`,
  `.mjs`, `.tsx`;
- any `?query` suffix (`?raw`, `?url`, `?inline`);
- any import attributes (`with { type: "json" }`, `with { type: "text" }`).

`.js` is allowed only for package subpaths that ship as `.js`
(`lit/decorators.js`); this repo's own files are all `.ts`. Bare packages,
`#` aliases, and `node:` builtins pass.

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
