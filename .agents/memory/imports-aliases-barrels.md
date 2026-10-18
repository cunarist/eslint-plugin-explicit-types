---
description: Shared code comes through # aliases in package.json imports, each src/ subfolder's entry is index.ts, barrels keep imports few; never ../ out of a directory; scripts/ is flat
---

## `#` aliases

Shared code is imported through Node subpath imports declared in
`package.json` `imports`, never by a relative path that climbs out of a
directory:

```jsonc
"imports": {
  "#helpers": "./src/helpers/index.ts",
  "#components/*": "./src/components/*"
}
```

```ts
import { typeNameTail } from "#helpers"; // yes
import { typeNameTail } from "../helpers/ast.ts"; // no: import/no-relative-parent-imports
```

Node, TypeScript, Vite, Vite+'s config bundler, and Oxlint's plugin loader
all resolve them natively, so `.ts` source runs unbuilt. `vp pack` inlines them,
so they never reach package consumers.

- Aliases point only at direct subfolders of `src/` (`#helpers` →
  `./src/helpers/index.ts`, or a `#x/*` pattern inside one such folder). Never
  at `src/` itself, a deeper folder, or anything outside `src/` (`scripts/`,
  root files); those are imported by relative path (`vite.config.ts` →
  `./src/plugin/index.ts`, `./scripts/project-lint.ts`). Rule from 2026-10-16.
  That is why the plugin lives in `src/plugin/index.ts` (`#plugin`), which is
  also the pack entry, and there is no `src/index.ts`: `tests/` would otherwise
  need a `../src` import, which `import/no-relative-parent-imports` forbids and
  no override may excuse ([[lint-overrides-policy]]).
- Aliases point at `.ts` files only. There is no `#package` alias
  ([[ts-only-files-and-imports]]).
- In repos linted by import-check, the key order of `imports` is the layer
  order `enforce-layer-order` checks; add a new alias at the right layer.
- Keep test-only helpers in their own alias (e.g. `#testing`) so they never
  land in a bundle.

## `index.ts` entries and barrels

- Every `src/` subfolder's entry file is `index.ts`, never `mod.ts` (decided
  2026-10-12). `index.ts` stands for a folder only inside `src/`
  (2026-10-16): `scripts/` is flat, with no subfolders and no `index.ts`, and
  its files are imported directly by name (`./scripts/project-lint.ts`).
- A directory used from outside exposes its API through its `index.ts`
  barrel, and callers import the barrel (`#ui`), not files inside it
  (`no-barrel-bypass`).
- Barrels are also the standard fix for `import/max-dependencies`: one barrel
  import replaces many direct ones ([[lint-overrides-policy]]).
- `import/no-cycle` is on; a barrel must not create a cycle.

Relative imports inside one directory (`./sibling.ts`) are fine, with the
`.ts` extension written out.
