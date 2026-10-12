# no-mapped-types

Rejects mapped types — `{ [K in Keys]: T }`.

## Why

A mapped type generates its members from another type, so nothing in the source
lists what the object actually has. To answer "does this have a `title`?" a
reader has to evaluate the mapping against a key union that is itself usually
derived. It is also the standard way an object gets used as a dictionary, which
hands you a type where every key is declared present and no lookup can fail —
exactly the guarantee a dictionary cannot make. Concrete fields make the shape
readable in place; a `Map` models a real dictionary honestly, with a lookup that
returns `undefined` when the key is absent.

## Examples

```ts
// BAD
type Flags = { [K in FeatureName]: boolean };

// GOOD
interface Flags {
  darkMode: boolean;
  betaSearch: boolean;
}

const overrides = new Map<string, boolean>();
```

## Notes

- Fires on every mapped type regardless of modifiers — `?`, `-?`, `readonly`,
  `-readonly`, and a renaming `as` clause are all still mapped types.
- Fires once per mapped type, on the whole `{ … }` construct.
- A mapped type over `keyof T` also trips `no-keyof`, and one whose value type
  is a utility type also trips `no-utility-types`; the diagnostics are
  independent.
- Index signatures are a different node and are handled by
  `no-index-signatures`, not here.
