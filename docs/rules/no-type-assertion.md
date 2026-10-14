# no-type-assertion

Rejects type assertions — `value as T` and the angle-bracket `<T>value`.
`as const` is allowed.

## Why

An assertion does not check anything; it instructs the compiler to stop
checking. Every one is a claim about a value that the code cannot back up, and
it stays in the source long after the reason for it is gone — a shape changes
upstream, the assertion keeps insisting, and the mismatch surfaces as a runtime
error at a line the types said was safe. Narrowing with `typeof` or `instanceof`
proves the claim instead of asserting it, and annotating the declaration moves
the type to where the compiler can verify it. `as const` is exempt because it
does not claim anything the source does not already say: it narrows a literal to
what is written right there.

## Examples

```ts
// BAD
const el = node as HTMLInputElement;
const n = <number>input;

// GOOD
const el = node instanceof HTMLInputElement ? node : null;
const n = typeof input === "number" ? input : 0;
const MODES = ["READ", "WRITE"] as const;
```

## Notes

- Both syntaxes fire: `value as T` and the angle-bracket form `<T>value`.
- `as const` is allowed. That is specifically an `as` whose annotation is the
  bare type reference `const`; an assertion to a real type named `Const` is
  still reported.
- `x as unknown as T` reports twice, once per assertion.
- Non-null assertions (`x!`) are not this rule's business — Oxlint's built-in
  `typescript/no-non-null-assertion` already covers them.
- `satisfies` looks related but is not reported. It checks a value against a
  type without overruling the compiler, and unlike an assertion it keeps the
  narrow inferred type — which is more precise than an annotation, not less.
- The report highlights the whole assertion expression, operand included.
