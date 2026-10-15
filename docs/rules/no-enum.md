# @cunarist/explicit-types/no-enum

📝 Disallow `enum` declarations.

💼 This rule is enabled in the 🔤 `naming` [config](https://github.com/cunarist/eslint-plugin-explicit-types#setup).

<!-- end auto-generated rule header -->

## Rule Details

This includes `const enum` and string enums.

`enum` is the one TypeScript type construct that emits a runtime value. That has
two costs. The declaration must be imported wherever a member is named, so a
type-only dependency turns into a real one and the enum object survives into the
bundle. And a numeric enum's members are opaque past the module boundary:
`{ status: 2 }` in a log, a database column, or a JSON payload means nothing
without the declaration in hand, and inserting a member renumbers everything
after it, silently reinterpreting data already written.

A string union expresses the same closed set with none of that. It is erased
entirely, needs no import to write a member, exhaustively narrows in a `switch`
the same way, and the value that reaches the wire is the token you wrote.

Its companion rule [`upper-snake-string-unions`](upper-snake-string-unions.md)
governs the replacement: this rule removes the construct, that one keeps the
union's members cased like the enum members they stand in for.

- Every enum form fires: numeric, string-valued, heterogeneous, `const enum`,
  and `declare enum`.
- An exported enum fires. The declaration arrives wrapped in
  `ExportNamedDeclaration`, but the visitor matches `TSEnumDeclaration`
  directly, so the wrapper is irrelevant.
- The report points at the enum's name, not the whole body, so the diagnostic
  stays readable for a long declaration.
- Members are not inspected — one diagnostic per enum, however many members it
  has.
- An enum imported from another module is not reported at its use sites. There
  is no cross-file resolution; only declarations in the linted file are seen.
- `pascal-case-types` also checks enum names, for the case where this rule is
  excluded but the `naming` preset is on.

Examples of **incorrect** code for this rule:

```ts
enum Status {
  Pending,
  Done,
}
```

Examples of **correct** code for this rule:

```ts
type Status = "PENDING" | "DONE";
const current: Status = "PENDING";
```

## When Not To Use It

If you want to keep enums, turn this rule off. The `naming` preset still works
without it: [`pascal-case-types`](pascal-case-types.md) keeps checking enum names
so they stay PascalCase.
