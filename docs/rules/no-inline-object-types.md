# explicit-types/no-inline-object-types

📝 Disallow inline object type literals.

💼 This rule is enabled in the 🧱 `concrete` [config](https://github.com/cunarist/eslint-plugin-explicit-types#configs-and-rules).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

## Rule Details

An object shape such as `{ a: string }` is reported wherever it appears in a
type position, including inside a type alias.

A shape written inline has no name, and a type with no name cannot be imported,
documented, or pointed at. The compiler prints it back to you in full every time
something fails to match, so a mismatch three fields deep arrives as a wall of
structure instead of "expected `TableCellState`".

It also cannot be reused, so the same shape gets retyped at each site that needs
it, and the copies drift. An `interface` costs one declaration and gives the
shape a name that error messages, imports, and the next reader all share.

This is the naming half of the same idea the rest of `concrete` enforces:
[`no-utility-types`](no-utility-types.md) and
[`no-mapped-types`](no-mapped-types.md) say write the shape out rather than
compute it; this one says give what you wrote a name.

- Every position is checked: parameters, return types, variable annotations,
  type alias right-hand sides, generic constraints, and nested members.
- `type X = { a: string }` fires. An alias names the shape, but `interface X`
  says the same thing and can be extended and merged, so the alias form is not
  treated as an exemption.
- Members of a union fire individually, so a discriminated union of four
  variants reports four times. That is deliberate: the variants of a
  discriminated union are exactly the shapes worth naming, since narrowing on
  the tag is how callers reach each one.
- An index signature inside an inline type reports twice — once here, once from
  [`no-index-signatures`](no-index-signatures.md) — because `{ [k: string]: T }`
  is both an unnamed shape and an index signature.
- `interface` bodies are not type literals, so they never fire. That is the
  shape the rule is steering toward.
- Object _values_ are untouched. `const a = { x: 1 }` is an expression, not a
  type.
- The report highlights the whole `{ … }` span, since the fix replaces all of it
  with a name.

Examples of **incorrect** code for this rule:

```ts
function parseCell(
  state: {
    openNode: (type: NodeType) => void;
    closeNode: () => void;
  },
  node: MarkdownNode,
): void {}
```

Examples of **correct** code for this rule:

```ts
interface CellWriter {
  openNode: (type: NodeType) => void;
  closeNode: () => void;
}

function parseCell(state: CellWriter, node: MarkdownNode): void {}
```

## When Not To Use It

If your codebase prefers `type X = { … }` aliases to interfaces, this rule
reports every one of them — the alias form is not exempt. It also reports each
variant of a discriminated union written inline. Turn it off if you do not want
every object shape to be a named `interface`.
