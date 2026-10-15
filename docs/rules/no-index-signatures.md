# @cunarist/explicit-types/no-index-signatures

📝 Disallow index signatures.

💼 This rule is enabled in the 🧱 `concrete` [config](https://github.com/cunarist/eslint-plugin-explicit-types#setup).

<!-- end auto-generated rule header -->

## Rule Details

An index signature is `{ [key: string]: T }`.

An index signature declares that every key is legal and every read succeeds. A
typo type-checks, a missing entry is typed as present, and the value comes back
as `T` rather than `T | undefined`, so the code that consumes it never learns it
has to handle absence. The failure surfaces later as a runtime `undefined` in a
place the type said could not happen. Concrete fields make the legal keys
reviewable; a `Map` keeps the dynamic keys but tells the truth about lookup,
returning `undefined` and forcing the caller to handle it.

- Fires on index signatures in interfaces, type literals, and class bodies
  alike.
- Any key type fires — `string`, `number`, and `symbol` signatures are all
  reported.
- A `readonly` index signature fires once, for being an index signature. The
  `readonly` modifier itself is not this package's concern.
- Mapped types look similar but are a separate node, covered by
  `no-mapped-types`.
- The report highlights the signature member, not the enclosing type.

Examples of **incorrect** code for this rule:

```ts
interface Config {
  [key: string]: string;
}
```

Examples of **correct** code for this rule:

```ts
interface Config {
  host: string;
  token: string;
}

const extras = new Map<string, string>();
```

## When Not To Use It

If you need a plain object with dynamic keys rather than a `Map` — and you
accept that every lookup is typed as present — this rule will reject the
signature that describes it. Turn it off in that code.
