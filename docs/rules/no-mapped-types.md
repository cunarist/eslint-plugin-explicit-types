# @cunarist/explicit-types/no-mapped-types

📝 Disallow mapped types.

💼 This rule is enabled in the 🧱 `concrete` [config](https://github.com/cunarist/eslint-plugin-explicit-types#setup).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

## Rule Details

A mapped type is `{ [K in Keys]: T }`.

A mapped type generates its members from another type, so nothing in the source
lists what the object actually has. To answer "does this have a `title`?" a
reader has to evaluate the mapping against a key union that is itself usually
derived. It is also the standard way an object gets used as a dictionary, which
hands you a type where every key is declared present and no lookup can fail —
exactly the guarantee a dictionary cannot make. Concrete fields make the shape
readable in place; a `Map` models a real dictionary honestly, with a lookup that
returns `undefined` when the key is absent.

- Fires on every mapped type regardless of modifiers — `?`, `-?`, `readonly`,
  `-readonly`, and a renaming `as` clause are all still mapped types.
- Fires once per mapped type, on the whole `{ … }` construct.
- A mapped type over `keyof T` also trips `no-keyof`, and one whose value type
  is a utility type also trips `no-utility-types`; the diagnostics are
  independent.
- Index signatures are a different node and are handled by
  `no-index-signatures`, not here.

Examples of **incorrect** code for this rule:

```ts
type Flags = { [K in FeatureName]: boolean };
```

Examples of **correct** code for this rule:

```ts
interface Flags {
  darkMode: boolean;
  betaSearch: boolean;
}

const overrides = new Map<string, boolean>();
```

## When Not To Use It

If you generate object types from a key union and accept that readers have to
evaluate the mapping to see the members, turn this rule off. Every mapped type
fires, whatever its modifiers, so there is no partial setting.
