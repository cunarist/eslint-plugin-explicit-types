---
description: absence preset: one spelling of absence per position, never two; ? on members and params, | null elsewhere
---

| Rule                | Src | Enforces                                    |
| ------------------- | --- | ------------------------------------------- |
| `no-undefined-type` | new | No `undefined` keyword in any type position |
| `no-optional-null`  | new | No binding that is both `?` and `\| null`   |

**This preset sits on a different axis from the other two, and should not be
judged by the through-line.** `concrete` and `naming` remove ways for a type to
be derived rather than written. These two do not: `a: T | undefined` is fully
written out, and `a?: T` — the form the rules require — hides the `undefined` in
a marker. The axis here is one spelling per idea:

- `?` **is** the undefined type, so writing the keyword as well is the same
  thing twice, and writing it instead is the long way round.
- A value that can be empty two ways has no definite empty value. The reader
  cannot tell which arrives and the body handles both.

Supersedes `no-undefined-return` from the dropped `disciplined` preset, which
covered only return types.

**One spelling per position, and never two at once.** A member or parameter says
absence with `?`; a return type or variable says it with `| null`:

|             | `?`                  | `\| undefined`    | `\| null` | `?` + `\| null`  |
| ----------- | -------------------- | ----------------- | --------- | ---------------- |
| parameter   | yes                  | no-undefined-type | yes       | no-optional-null |
| member      | yes                  | no-undefined-type | yes       | no-optional-null |
| return, var | not legal TypeScript | no-undefined-type | yes       | not legal        |

`?` is legal in exactly two places — `let v?: T` is a syntax error, and
`get g?()` is too — so parameters and members are the whole surface for
`no-optional-null`. A default value is not the `?` marker, so
`f(a: string | null = null)` stays clean.

See [[absence-history]] for what was tried and dropped.
