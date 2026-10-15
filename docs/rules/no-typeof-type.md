# @cunarist/explicit-types/no-typeof-type

📝 Disallow `typeof` in type positions.

💼 This rule is enabled in the 🧱 `concrete` [config](https://github.com/cunarist/eslint-plugin-explicit-types#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

`typeof` in a type position inverts the direction a program should be read: the
type becomes a consequence of an initializer instead of a contract the
initializer has to meet. Add a property to the object literal and every
annotation written as `typeof config` quietly grows with it, with no error at
any of them. Declaring the type first and annotating the value with it restores
the check — the literal now has to satisfy something written down, and drifting
from it fails at the definition rather than surprising a distant caller.

- Only the type-position `typeof` (`TSTypeQuery`) is reported. The runtime
  `typeof x === "string"` operator is an expression and is never touched —
  narrowing with it is the recommended alternative to an assertion.
- `typeof import("./index.ts")` is also a `TSTypeQuery` and fires.
- `keyof typeof x` reports twice: once here, once from `no-keyof`.
- The report highlights the whole `typeof x` query including the keyword.

Examples of **incorrect** code for this rule:

```ts
const defaults = { retries: 3, timeout: 1000 };

function apply(options: typeof defaults): void {}
```

Examples of **correct** code for this rule:

```ts
interface Options {
  retries: number;
  timeout: number;
}

const defaults: Options = { retries: 3, timeout: 1000 };

function apply(options: Options): void {}
```

## When Not To Use It

If you want a type to follow its initializer, growing as the value does, this
rule rejects that by design. It also reports `typeof import(…)`, so turn it off
where taking a module's or value's type from its source is what you intend.
