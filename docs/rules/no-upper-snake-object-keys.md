# no-upper-snake-object-keys

Disallow UPPER_SNAKE_CASE object keys and type members. This covers object
literal keys and interface or type-literal members.

## Why

[`upper-snake-string-unions`](upper-snake-string-unions.md) makes every string
union member UPPER_SNAKE_CASE, so an object wearing that casing is almost always
one thing: a lookup table keyed by a union.

That table stops the compiler helping. Adding `"CANCELLED"` to the union does
not make the lookup a compile error; it makes the lookup return `undefined` at
runtime, in whichever branch reaches the new state first. A `switch` on the same
union fails to compile the day the member is added, which is the whole point of
having written the union down.

The rule is deliberately narrow. It does **not** ask for camelCase keys in
general, because most non-camelCase keys are names nobody here chose — a custom
element tag, a DOM attribute, an HTTP header, a library's command names. Those
are foreign vocabularies, not lookup tables, and forcing them to change would
break the contract they belong to. Only the casing this package itself
prescribes for union members is treated as a signal.

## Examples

```ts
type TaskState = "PENDING" | "DONE";

// BAD - add "CANCELLED" to TaskState and this still compiles
const LABELS = { PENDING: "Waiting", DONE: "Finished" };
const text = LABELS[state];

// GOOD - add "CANCELLED" and this stops compiling
function labelOf(state: TaskState): string {
  switch (state) {
    case "PENDING":
      return "Waiting";
    case "DONE":
      return "Finished";
  }
}
```

## Notes

- Names defined elsewhere pass, which is the reason for the narrow shape:
  `"cl-zip-dialog"` (HTML requires the hyphen), `"data-language"`,
  `"Content-Type"`, `"Mod-z"`, `$anchor`, `TSIndexSignature`, `ToggleBold`.
- `snake_case` keys are left alone. Under Deno this split with the built-in
  `camelcase` rule, which reported them. Oxlint ships no `camelcase` rule, and
  restoring that coverage is an open follow-up.
- Quoting is not an escape hatch. `{ "PENDING": 1 }` fires exactly as
  `{ PENDING: 1 }` does; the rule reads the spelling, not the syntax around it.
- Class members are not checked. `static MAX_RETRIES = 5` is a constant, not a
  map key.
- Destructuring is not checked — `const { PENDING } = labels` binds a name
  rather than declaring a key.
- Computed keys are skipped, since `{ [key]: value }` cannot be judged from
  syntax. The index signature you would need to type it is rejected by
  `no-index-signatures` anyway.
- Numeric keys are not checked. They were, under the rule's earlier and wider
  shape; `{ 0: "a" }` is an array written as an object, which is a different
  complaint from this one.
- Shorthand and method shorthand are checked like any other key: `{ PENDING }`
  and `{ DO_THING() {} }` both fire.
- A `Map` keyed by a union slips through, and it shares the same weakness — a
  new member does not break `map.get(state)`. It at least returns
  `T | undefined`, forcing the caller to handle absence, which the object form
  does not.

## Crossing the boundary

Parse inside one module, reach into the result with quoted string keys, and hand
back a struct. Nothing downstream ever sees the wire spelling.

```ts
// wire.ts — the only module that knows the wire format

interface UserRow {
  userId: string;
  displayName: string;
}

export function toUserRow(responseText: string): UserRow {
  const jsonParsed: any = JSON.parse(responseText);
  return {
    userId: jsonParsed["user_id"],
    displayName: jsonParsed["profile"]["INNER_FIELD"],
  };
}
```

The foreign names appear as string literals in a bracket access, not as keys, so
there is nothing for the rule to report. Declaring the wire shape as a type
instead would move the foreign spelling into the type system, where it outlives
the boundary and every later reader has to carry it.

`no-explicit-any` will flag that annotation. Ignore it on the one line, or drop
it entirely — `JSON.parse` already returns `any`, so
`const jsonParsed = JSON.parse(responseText)` behaves identically.
