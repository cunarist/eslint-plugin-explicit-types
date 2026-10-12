---
description: The repo lints itself from src/index.ts as a jsPlugin, with nothing excluded
---

`vite.config.ts` loads `./src/index.ts` as a `jsPlugins` entry and spreads
`recommendedConfig.rules`, so a new rule applies at once to the code that
implements it. Oxlint strips the types itself on Node 24, `#` imports and the
JSON import of `package.json` included; no build runs first.

When a rule fires here, fix the source. No file carries an `oxlint-disable` or
`eslint-disable`: rule records are `Map`s keyed by rule id, because a record is
a lookup and ids belong in value position (`no-upper-snake-object-keys` applied
to itself); `Object.fromEntries` turns one into the object a plugin needs.
Visitor objects stay literals: their keys are PascalCase AST node names.
