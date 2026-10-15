# @cunarist/explicit-types/no-utility-types

📝 Disallow the built-in TypeScript utility types.

💼 This rule is enabled in the 🧱 `concrete` [config](https://github.com/cunarist/eslint-plugin-explicit-types#setup).

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

## Rule Details

All 22 are reported: `Partial`, `Record`, `ReturnType`, `Omit`, and the rest.

A utility type names a transformation, not a shape. `Omit<User, "password">`
tells the reader to go find `User`, hold its fields in their head, and subtract
one. The answer is invisible at the use site and it moves: adding a field to
`User` silently changes what every `Partial<User>` and `keyof User` means, with
no diff anywhere near the code that depends on it. Writing the resulting type
out makes the shape readable where it is used, and turns a change to the
underlying type into a compile error at the places that actually care.

- All 22 built-ins are matched: `Awaited`, `Partial`, `Required`, `Readonly`,
  `Record`, `Pick`, `Omit`, `Exclude`, `Extract`, `NonNullable`, `Parameters`,
  `ConstructorParameters`, `ReturnType`, `InstanceType`, `ThisParameterType`,
  `OmitThisParameter`, `ThisType`, `NoInfer`, `Uppercase`, `Lowercase`,
  `Capitalize`, `Uncapitalize`.
- Matching is by the **last** name segment, so a qualified reference like
  `ns.Partial<T>` fires too.
- Matching is by name only — there is no cross-file resolution, so a local type
  you happen to call `Record` is also reported, and a renamed import
  (`import type { Partial as P }`) is not.
- Only type positions are checked. A _value_ named `Record` — a variable, a
  function call — is untouched, because it is not a `TSTypeReference`.
- `Readonly<T>` is reported here as a utility type. The bare `readonly` keyword
  is a separate concern, and this package does not police it.
- `InvalidTestCase["errors"]` from ESLint's `RuleTester` types is reached by
  indexed access, which is not a `TSTypeReference`, so it passes. That is deliberate — see the
  note on derivation in `.agents/memory/indexed-access-is-allowed.md`.

Examples of **incorrect** code for this rule:

```ts
type Draft = Partial<Article>;
type Titles = Record<string, string>;
```

Examples of **correct** code for this rule:

```ts
interface Draft {
  title: string | null;
  body: string | null;
}

type Titles = Map<string, string>;
```

## When Not To Use It

If you want types like `Partial<User>` or `Omit<User, "password">` to follow
`User` as it changes, this rule rejects them by design. Matching is by name, so
it also reports a local type you happen to call `Record`; turn the rule off if
your code declares its own types with these names.
