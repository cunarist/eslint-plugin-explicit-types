---
description: no-optional-members was dropped, the parameter exemption removed, and accessor fields stopped being a blind spot
---

**`no-optional-members` was built and then dropped.** It banned `?` on members
outright, forcing `T | null`, on the argument that an optional field can be left
out so adding one compiles silently at every construction site while `| null`
makes it an error there. That is a real property, and the uniform object shape
it produces is what lets an engine hold one hidden class per object. It was cut
because `?` is shorter and reads better, and because forcing `| null` onto
members demands a normalising layer wherever JSON is parsed — a missing key is
`undefined` at runtime, so the declared type is otherwise false. Wanting it back
means writing it again; it was one `TSPropertySignature`/`TSMethodSignature`/
`PropertyDefinition` visitor on `.optional`, plus a source-text read for
`AccessorProperty`.

Earlier drafts exempted parameters from `no-undefined-type`, on the grounds that
a callback's shape is fixed by a library. That exemption turned out to be
unnecessary: `?` already satisfies those signatures — a Lit `ref` handler is
`(el?: Element) => void` — so the keyword can be banned outright and `?` is the
replacement. Checked against `../memona`, where `?:` appears 312 times across 70
files: every one is a member or a callback parameter, and all of them stay
legal.

The one case with no `?` form is a required parameter that must accept absence
in a non-trailing position, since `f(a?: number, b: string)` does not compile.
`| null` covers it.

Removing the exemption made the rule a bare `TSUndefinedKeyword` visitor, and it
immediately fired on this repo's own `identifierName` helper. The fix is the
rule's own prescription, and the second step came from `no-optional-null`:
`node: Identifier | null | undefined` → `node?: Identifier | null` →
`node: Identifier | null`.

**`accessor` fields were a blind spot under Deno and no longer are.** Deno's
lint AST never walked an `AccessorProperty` type annotation, so
`accessor a: string | undefined` passed; a source-text scanner was written to
close the gap and deleted as not worth ~90 lines of tokenizing. Oxlint walks the
annotation, so `no-undefined-type` now reports it with no extra code.
`accessor a?: string | null` does not parse under Oxlint, so `no-optional-null`
has nothing to see there.
