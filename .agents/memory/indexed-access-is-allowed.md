---
description: Indexed access stays legal: it is the only way to name a type someone else wrote
---

Indexed access — `Config["host"]` — derives a type from another type exactly as
`keyof` does, and it is **not** banned. That is a decision, not an oversight.

The rules govern types you write. They cannot govern types someone else already
wrote, and a codebase has to name those to consume them. When a library hands
you a map-shaped field, indexed access is the only way to refer to it without
re-declaring a shape you do not own:

```ts
// a library's type, not yours
interface Options {
  retries: Record<string, number>;
}

const r: Record<string, number> = opts.retries; // no-utility-types
const r: { [k: string]: number } = opts.retries; // no-index-signatures
const r: Options["retries"] = opts.retries; // the way through
```

So the split is **authorship**: a type you declare gets written out; a type you
are handed gets reached into. Banning indexed access would leave no legal way to
name the second kind.

This package hits the same wall, which is how the gap was found. Typing a rule
record against Deno's plugin API (and now Oxlint's, the same way):

| Annotation                        | Result                      |
| --------------------------------- | --------------------------- |
| `Record<string, Deno.lint.Rule>`  | `no-utility-types`          |
| `{ [k: string]: Deno.lint.Rule }` | `no-index-signatures`       |
| none                              | JSR `missing-explicit-type` |
| `Deno.lint.Plugin["rules"]`       | the only one that passes    |

This port avoids the question with `Map`s for its own rule records, and still
reaches into library types the same way where it must:
`InvalidTestCase["errors"]` from ESLint's `RuleTester` in the test harness.

All four were checked. So the line is: **named transformations** (`keyof`,
`typeof`, utility types, mapped types) are banned; picking a single field out of
a type is not. If a `no-indexed-access` rule is ever proposed, this is why it
was not written — it would close the only door out of someone else's types.

`no-unknown` was removed for the same class of reason. TypeScript allows only
`any` or `unknown` on a `catch` binding, so banning `unknown` while the README
recommends `no-explicit-any` left no way to annotate a caught error — and
`unknown` is the safer of the two, since `any` disables checking and spreads to
everything it touches.
