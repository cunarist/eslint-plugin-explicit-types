# explicit-types/single-capital-type-params

📝 Require type parameters to be named with a single capital letter.

💼 This rule is enabled in the 🔤 `naming` [config](https://github.com/cunarist/eslint-plugin-explicit-types#configs-and-rules).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

## Rule Details

Every type parameter must be named with one capital letter: `T`, `K`, `V`, and
so on. Names such as `Item`, `TValue`, or a lowercase `t` are reported.

A type parameter is a placeholder, not a type anyone declared. Written as
`Item`, it looks exactly like the PascalCase interface
[`pascal-case-types`](pascal-case-types.md) asks for, so at a use site such as
`items: Item[]` the reader has to look up the signature to learn that `Item` is
whatever the caller passes. A single capital cannot be mistaken for a
declaration: the shape of the name says it is a parameter.

- Several parameters may use any distinct capitals, in any order: `<K, V>`,
  `<T, U>`, and `<B, A>` all pass. TypeScript already rejects a repeated name.
- Every declaration that takes type parameters is checked: functions, arrow
  functions, methods, classes, interfaces, type aliases, and function and
  constructor types.
- `infer` types and mapped type keys are not checked;
  [`no-conditional-types`](no-conditional-types.md) and
  [`no-mapped-types`](no-mapped-types.md) reject those constructs outright.
- There is no autofix. A suggestion renames the parameter and its uses within
  its declaration, to the name's initial (read past a `T` prefix, so `TValue`
  offers `V`), else the first of `T`, `U`, `V`, `W`, then the rest of the
  alphabet that does not appear anywhere in the declaration's text. When every
  capital is taken, the report carries no suggestion. Merged interface
  declarations must agree on their parameter names, so renaming one of them
  needs the others renamed by hand.

Examples of **incorrect** code for this rule:

```ts
function first<Item>(items: Item[]): Item | null {
  return items[0] ?? null;
}
type Box<TValue> = { value: TValue };
interface Entry<Key, Value> {
  key: Key;
  value: Value;
}
```

Examples of **correct** code for this rule:

```ts
function first<T>(items: T[]): T | null {
  return items[0] ?? null;
}
type Box<V> = { value: V };
interface Entry<K, V> {
  key: K;
  value: V;
}
```

## When Not To Use It

If your codebase gives type parameters descriptive names, as some style guides
recommend for signatures with many parameters, turn this rule off.
