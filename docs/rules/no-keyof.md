# @cunarist/explicit-types/no-keyof

📝 Disallow the `keyof` type operator.

💼 This rule is enabled in the 🧱 `concrete` [config](https://github.com/cunarist/eslint-plugin-explicit-types#setup).

<!-- end auto-generated rule header -->

## Rule Details

`keyof T` is a union that nobody wrote down and nobody reviews. Its members
change the moment `T` gains or loses a field, so a rename in one interface
silently widens or narrows the accepted values at every call site that took a
`keyof`. Because the union is never spelled out, the change produces no diff
where it matters and no error where it breaks. Writing the key names out makes
the set of legal keys a reviewable list, and adding a field to `T` then has no
effect until someone deliberately adds it here too.

- Fires on `keyof` anywhere a type operator is legal: parameter and return
  annotations, type aliases, generic constraints, and inside a mapped type's
  constraint.
- Only the `keyof` operator is matched. `readonly T[]` is the same AST node with
  a different operator, and this rule ignores it.
- `keyof typeof x` produces two diagnostics — one here and one from
  `no-typeof-type` — because it derives twice over.
- The report highlights the whole `keyof T` operator expression, not just the
  keyword.

Examples of **incorrect** code for this rule:

```ts
function sortBy(field: keyof Article): void {}
```

Examples of **correct** code for this rule:

```ts
type ArticleField = "TITLE" | "AUTHOR" | "PUBLISHED_AT";

function sortBy(field: ArticleField): void {}
```

## When Not To Use It

If you want the set of accepted keys to follow a type automatically as fields
are added or removed, that is exactly the behaviour this rule rejects. Turn it
off where tracking `T`'s keys without a written list is what you intend.
