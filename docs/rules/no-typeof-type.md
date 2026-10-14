# no-typeof-type

Disallow `typeof` in type positions.

## Why

`typeof` in a type position inverts the direction a program should be read: the
type becomes a consequence of an initializer instead of a contract the
initializer has to meet. Add a property to the object literal and every
annotation written as `typeof config` quietly grows with it, with no error at
any of them. Declaring the type first and annotating the value with it restores
the check — the literal now has to satisfy something written down, and drifting
from it fails at the definition rather than surprising a distant caller.

## Examples

```ts
// BAD
const defaults = { retries: 3, timeout: 1000 };

function apply(options: typeof defaults): void {}

// GOOD
interface Options {
  retries: number;
  timeout: number;
}

const defaults: Options = { retries: 3, timeout: 1000 };

function apply(options: Options): void {}
```

## Notes

- Only the type-position `typeof` (`TSTypeQuery`) is reported. The runtime
  `typeof x === "string"` operator is an expression and is never touched —
  narrowing with it is the recommended alternative to an assertion.
- `typeof import("./index.ts")` is also a `TSTypeQuery` and fires.
- `keyof typeof x` reports twice: once here, once from `no-keyof`.
- The report highlights the whole `typeof x` query including the keyword.
