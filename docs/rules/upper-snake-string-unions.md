# @cunarist/explicit-types/upper-snake-string-unions

📝 Enforce UPPER_SNAKE_CASE for string literal union members.

💼 This rule is enabled in the 🔤 `naming` [config](https://github.com/cunarist/eslint-plugin-explicit-types#setup).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

## Rule Details

Every string literal member of a union must match
`/^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/`.

A string union is an enumeration written in the type system, and its members are
protocol tokens: they get compared, switched on, and stored. Written as
`"in progress"` or `"inProgress"` they read like display text, and that is
exactly how they start being used — someone renders the value in a UI, someone
else translates it, and now a wire token cannot change without breaking the
screen. Casing them like constants keeps the distinction visible at every use
site: an UPPER_SNAKE token is obviously an identifier to be mapped to text, not
text itself. It also removes the class of bug where `"inprogress"` and
`"inProgress"` are separate members nobody notices, since the casing rule leaves
one spelling available per token.

This rule is the other half of [`no-enum`](no-enum.md). That rule removes the
`enum` construct; this one governs the string union that replaces it, so the
replacement keeps the constant-like naming an enum member had.

- Only union type aliases are checked. A single non-union literal alias like
  `type Mode = "fast";` is not reported.
- Non-string union members are ignored: numeric literals, `null`, booleans, type
  references, and object types pass through untouched, so
  `type Id = "USER_ID" | number;` is clean.
- A mixed union reports once per offending string member, not once per
  declaration.
- Digits are allowed inside a segment — `HTTP2` and `LEVEL_3` pass — but a
  segment may not be empty, so a leading, trailing, or doubled underscore fires.
- Unions written inside an interface member, a function parameter, or a variable
  annotation are not checked. Only `TSTypeAliasDeclaration` is visited, which is
  where a named token set belongs.

Examples of **incorrect** code for this rule:

```ts
type Status = "pending" | "in progress" | "Done";
```

Examples of **correct** code for this rule:

```ts
type Status = "PENDING" | "IN_PROGRESS" | "DONE";
```

## When Not To Use It

If a union alias lists string values fixed by something outside your code — an
external API or format whose tokens are not UPPER_SNAKE_CASE — this rule will
report them. Turn it off where the union's members are not yours to name.
