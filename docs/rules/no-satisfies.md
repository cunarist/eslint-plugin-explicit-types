# explicit-types/no-satisfies

📝 Disallow the `satisfies` operator.

💼 This rule is enabled in the 🧱 `concrete` [config](https://github.com/cunarist/eslint-plugin-explicit-types#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

`value satisfies T` checks the value against `T`, but the declaration does not
get the type `T`. Its type is still inferred from the expression: the compiler
computes it from whatever the value happens to be, and nobody wrote it down. A
reader has to work the type out from the initializer, a hover shows a shape no
declaration names, and editing the value silently changes the type every user of
the variable sees. An annotation on the declaration states the type once, where
it is declared, and every use is checked against that written type.

- Every `TSSatisfiesExpression` is reported, wherever it appears: a variable
  initializer, a call argument, a return value, `export default`.
- `x as const satisfies T` is reported too; `as const` alone is allowed.
- A class expression is covered: `const A = class {} satisfies B` is reported.
  Annotate the variable, or declare the class with `implements`.
- `implements` on a class is untouched. It checks the class against an
  interface without replacing the class's own declared type, so nothing is
  left inferred.
- `a satisfies A satisfies B` reports twice, once per operator.
- The report highlights the whole `satisfies` expression, operand included.

Examples of **incorrect** code for this rule:

```ts
interface Config {
  host: string;
}

const config = { host: "a" } satisfies Config;
const Handler = class {} satisfies HandlerClass;
```

Examples of **correct** code for this rule:

```ts
interface Config {
  host: string;
}

const config: Config = { host: "a" };
const Handler: HandlerClass = class {};
```

## When Not To Use It

If you want a value checked against a type while keeping its narrower inferred
type, for example to keep literal keys or tuple positions that the annotated
type would widen away, this rule reports that use. Turn it off in that code.
