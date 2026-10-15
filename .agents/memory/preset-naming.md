---
description: naming preset: PascalCase types, UPPER_SNAKE unions, no union-shaped keys, no enum; camelcase is Oxlint id-match
---

| Rule                         | Src | Enforces                                                    |
| ---------------------------- | --- | ----------------------------------------------------------- |
| `pascal-case-types`          | mem | Class, interface, type alias, and enum names are PascalCase |
| `upper-snake-string-unions`  | mem | String literals in any union type are UPPER_SNAKE_CASE      |
| `no-upper-snake-object-keys` | new | No UPPER_SNAKE_CASE object keys or type members             |
| `no-enum`                    | new | No `enum` — use an UPPER_SNAKE_CASE string union            |

These three interlock. `no-enum` removes the construct;
`upper-snake-string-unions` governs the string union that replaces it; and
`no-upper-snake-object-keys` stops those UPPER_SNAKE_CASE members from being
turned back into a lookup table — an object is a struct, so a union-keyed lookup
must be a `switch` function, which fails to compile when a member is added.

**`no-upper-snake-object-keys` was narrowed after being tried on `../memona`.**
It originally demanded camelCase keys outright, which produced over a hundred
reports on names nobody there had chosen: custom element tags (HTML requires the
hyphen), `data-*` attributes, HTTP headers, ProseMirror keymaps and command
names, `$`-prefixed library APIs, and this package's own AST visitor keys. All
of them are foreign vocabularies rather than lookup tables. Restricting the rule
to UPPER_SNAKE_CASE — the casing `upper-snake-string-unions` itself prescribes —
keeps the intended target and clears every one of those, and it let the
`deno-lint-ignore-file` lines come out of this repo's own rule files.

Under Deno the rule divided cleanly with the built-in `camelcase`, which
reported unquoted `snake_case` keys. Oxlint ships no `camelcase` rule; this repo
uses the built-in `id-match` instead (see [[lint-parity-with-deno]]), with
`properties: false`, so unquoted `snake_case` object keys are no longer reported
here. That is accepted rather than widening this rule, which would reopen the
foreign-vocabulary problem above. Nothing is added to the published plugin: it
carries exactly the 15 rules of the Deno plugin.

`upper-snake-string-unions` visits `TSUnionType` rather than
`TSTypeAliasDeclaration`, so a union written inline on an interface member
(`type: "Directory" | "File"`) is held to the same casing as an aliased one.
Checking only aliases left that entire shape unguarded.
