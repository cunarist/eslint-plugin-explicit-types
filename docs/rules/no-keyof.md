# no-keyof

Rejects the `keyof` type operator in any type position.

## Why

`keyof T` is a union that nobody wrote down and nobody reviews. Its members
change the moment `T` gains or loses a field, so a rename in one interface
silently widens or narrows the accepted values at every call site that took a
`keyof`. Because the union is never spelled out, the change produces no diff
where it matters and no error where it breaks. Writing the key names out makes
the set of legal keys a reviewable list, and adding a field to `T` then has no
effect until someone deliberately adds it here too.

## Examples

```ts
// BAD
function sortBy(field: keyof Article): void {}

// GOOD
type ArticleField = "TITLE" | "AUTHOR" | "PUBLISHED_AT";

function sortBy(field: ArticleField): void {}
```

## Notes

- Fires on `keyof` anywhere a type operator is legal: parameter and return
  annotations, type aliases, generic constraints, and inside a mapped type's
  constraint.
- Only the `keyof` operator is matched. `readonly T[]` is the same AST node with
  a different operator, and this rule ignores it.
- `keyof typeof x` produces two diagnostics — one here and one from
  `no-typeof-type` — because it derives twice over.
- The report highlights the whole `keyof T` operator expression, not just the
  keyword.
