# no-conditional-types

Rejects conditional types — `T extends U ? A : B` — and the `infer` keyword.

## Why

A conditional type is a branch evaluated by the compiler, not by the reader. To
know what `Unwrap<Response>` is, you have to hold `Response` in your head, match
it against the `extends` clause, and pick a side — and repeat that every time
the input changes. `infer` makes it worse by naming a type nobody wrote: the
name exists only inside the condition, and what it stands for depends on the
argument.

This is the same defect [`no-keyof`](no-keyof.md) and
[`no-mapped-types`](no-mapped-types.md) reject, one step further along. A
conditional type does not describe a shape; it describes a computation that
produces one. Writing the results out and naming them puts the answer where the
reader already is.

## Examples

```ts
// BAD
type Unwrap<T> = T extends Array<infer E> ? E : never;
type Items = Unwrap<TaskSnapshot[]>;

// GOOD
type Items = TaskSnapshot;
```

## Notes

- Both halves of the pair fire independently. `T extends Array<infer E> ? E : X`
  reports twice — once for the conditional, once for the `infer`.
- Nested conditionals report once each, so a chain of three reports three times.
- `infer` is only legal inside a conditional type's `extends` clause, so it
  never fires on its own in practice.
- Distributive conditionals are not treated specially.
  `T extends string ? A : B` applied to a union is the same node.
- The report highlights the whole conditional type, and for `infer` just the
  `infer E` fragment, since those are the spans a reader has to evaluate.
- A generic type alias without a condition is fine.
  `type Wrapper<T> = { value: T }` parameterises a shape rather than computing
  one.
