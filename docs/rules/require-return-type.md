# require-return-type

Requires every named function to declare its return type. Callbacks passed
inline are exempt.

## Why

Without an annotation, the only way to learn what a function gives back is to
read its body to the end — every branch, every early return, every `throw`. The
signature, which is the part callers actually read, stays silent about the one
thing they need.

It also lets the contract drift without anyone noticing. Add a branch that
returns `null` and the function's type quietly becomes `T | null`; nothing in
the diff says so, and every call site silently gains a case it does not handle.
An annotation turns that same edit into a compile error at the function itself,
which is where the decision was made.

Callbacks are exempt because their type is already fixed by the signature they
are handed to. `items.map((item) => item.id)` gets its return type from `map`,
so writing it again adds noise without adding a contract.

## Examples

```ts
// BAD - read to the end to find out it can be null
function findTask(id: string) {
  const found = tasks.get(id);
  if (found === undefined) return null;
  return found;
}

// GOOD
function findTask(id: string): TaskSnapshot | null {
  const found = tasks.get(id);
  if (found === undefined) return null;
  return found;
}

// fine either way - the callback's type comes from `map`
const ids = tasks.map((task) => task.id);
```

## Notes

- Constructors and `set` accessors are skipped. TypeScript rejects a return type
  annotation on both, so requiring one would demand code that cannot compile.
- `get` accessors and ordinary methods are checked.
- A function expression or arrow assigned to a variable is checked —
  `const f = () => 1` is a named function, whatever the syntax.
- A function passed as an argument is not checked, which is the callback
  exemption. The test is the parent node, so an arrow in an array or an object
  literal is also left alone.
- Interface and type-literal method signatures are checked.
  `interface I { m() }` fires; `interface I { m(): void }` does not.
- Overload signatures and abstract methods are checked as well — they are the
  declaration a caller reads.
- The report highlights the function's name where it has one, and the whole
  function otherwise, so an anonymous assigned arrow points at the arrow.
- `async` functions are checked like any other; the annotation is the
  `Promise<T>` the caller sees.
