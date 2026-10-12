# eslint-plugin-explicit-types

An ESLint plugin for TypeScript style that also runs under Oxlint, published to
npm as `@cunarist/eslint-plugin-explicit-types`. Ported from the Deno lint
plugin of the same rules (`jsr:@cunarist/deno-lint-plugin-explicit-types`, last
at 0.5.1); rule names, behaviour, and messages carry over, but the three Deno
plugins became one, so rule ids changed. Sibling of `../deno-lint-plugin-lit`;
this is the home for the general-TS rules that plugin deliberately excluded as
out of scope.

Source of the rules: `../memona` — `user_app/scripts/deno-lint-plugin.ts` (the
`restricted-types` mega-rule plus several standalone rules) and the TypeScript
section of `.agents/memory/coding-standards.md`. That is the house style and it
wins on any conflict.

**The through-line:** a type is written out, not derived. If the compiler can
infer it, that is convenience; if the _reader_ has to run the compiler in their
head to know what a value is, that is a defect. The `concrete` and `naming`
rules each remove one way to leave a type implicit — utility types, `keyof`,
`typeof`, mapped types, index signatures, conditional types, and assertions.

`absence` is the exception, added later on a second axis: one spelling per idea,
so a value's empty form is a single definite thing. See that preset's section
before adding a rule to it — the through-line is the wrong test there.

---

## Working style

Keep responses short. State the decision and what changed — no restating
rationale already written here, no summarizing edits the user can read. Detail
belongs in this file, not in chat.

## Project conventions

- Node.js 24+ and Vite+ (`vp`). The only config files are `package.json`,
  `tsconfig.json`, and `vite.config.ts`, plus `package-lock.json`. Only `.ts`
  files, configs included; build output in the ignored `dist/` is the exception.
- `vp check` (format, lint, type check), `vp test`, and `vp pack` must all pass;
  CI runs the three. `vp check --fix` formats.
- **This package lints itself with its own rules, with nothing excluded
  repo-wide.** `vite.config.ts` loads `./src/index.ts` straight from source as a
  `jsPlugins` entry — Oxlint strips the types itself on Node 24 — and spreads
  `recommendedConfig.rules`, so a new rule immediately applies to the source
  that implements it. When a rule fires here, fix the source.
- **Lint coverage never shrinks below what Deno enforced.** `vite.config.ts`
  lists the Oxlint equivalent of every rule Deno's `recommended` and `jsr` tags
  and the old include list turned on; the rest are covered by the parser,
  `typeCheck`, tsconfig, or `vp pack`. Read the parity table in the porting PR
  before removing a line. `maxWarnings: 0` keeps Deno's every-diagnostic-fails
  behaviour.
- **No file in this repo carries an `oxlint-disable` or `eslint-disable`.** Rule
  records are `Map`s keyed by rule id, because a rule record really is a lookup,
  so the ids belong in value position; `Object.fromEntries` turns one into the
  plain object a plugin needs. Lint visitors keep their object literal, since
  their keys are AST node names in PascalCase rather than UPPER_SNAKE_CASE.
  `meta.messages` keys are camelCase message ids.
- **Rules use the standard ESLint API** — `create`, not Oxlint's `createOnce` —
  and are typed `ExplicitRule` (in `#helpers`): `@eslint/core`'s
  `RuleDefinition`, with `TSESTree` nodes from `@typescript-eslint/types` so
  `context.report` takes TypeScript nodes. ESLint's visitor type is loose, so
  **every visitor annotates its node parameter**; the type-aware `no-unsafe-*`
  rules fail on one left `any`. There are no runtime dependencies, and every
  type package is a devDependency: `vp pack` inlines the few types the public
  `.d.ts` needs.
- **Every rule test runs under both ESLint's and Oxlint's `RuleTester`**, from
  `testRule` in `#testing`, with no ESLint config file. Write cases once, in
  ESLint's shape and its 1-based columns; the harness shifts columns for
  Oxlint's 0-based count.
- Rule messages are one string: Deno's `message` and `hint` joined. ESLint and
  Oxlint diagnostics have no separate hint field. Report with `messageId` and
  `data`, so tests can assert which message fired.
- **Exported declarations carry explicit types.** `isolatedDeclarations` is on;
  `vp check` does not enforce it, but `vp pack` fails with TS9010 on an export
  whose type is not trivially inferable — the same line Deno's `no-slow-types`
  drew.

### File layout

**Everything under `src/` is named in kebab-case**, so a file name is the rule
id it implements — `no-utility-types` is in `no-utility-types.ts`, documented in
`no-utility-types.md`, tested in `no-utility-types.test.ts`, and no translation
step sits between the diagnostic a user sees and the file they open.

    src/index.ts                         the plugin and its configs
    src/concrete/index.ts                the preset's rule map
    src/concrete/no-utility-types.ts
    src/concrete/no-utility-types.md
    src/concrete/no-utility-types.test.ts

Every directory's entry file is `index.ts`, the Node convention. `src/index.ts`
is the only package entry; a preset's `index.ts` exports its rule `Map` and
nothing else. Tests sit beside the rule: the package publishes only `dist/`, so
colocation costs nothing in the tarball, and Vitest's default include finds
`*.test.ts` without config.

**Shared code is imported through `#` subpath imports**, never a relative path
out of a directory:

```ts
import { typeNameTail } from "#helpers";
import { spanOf, testRule } from "#testing";
```

The aliases are `package.json` `imports`, which Node, TypeScript, Vite, and
Oxlint's plugin loader all resolve natively, so the source runs unbuilt. They
point at `.ts` files and never reach consumers: `vp pack` inlines them.
`#testing` is kept apart from `#helpers` so neither tester lands in a bundle. `#package` is `package.json`, so the plugin reads its own name and version
without a parent-relative import, which `import/no-relative-parent-imports`
rejects.

### Packaging: one plugin, presets as configs

ESLint's convention is one plugin per package, named from the package:
`@cunarist/eslint-plugin-explicit-types` becomes the namespace
`@cunarist/explicit-types`. Oxlint normalizes `meta.name` the same way
(verified), so a rule id is `@cunarist/explicit-types/no-keyof` under both.

The Deno package was three plugins — `explicit-concrete`, `explicit-naming`,
`explicit-absence` — because Deno's plugin API had no presets. Those survive as
flat configs: `concreteConfig`, `namingConfig`, `absenceConfig`, and
`recommendedConfig` for all three, exported by name and on `plugin.configs`.
ESLint users list a config; Oxlint, whose plugins have no `configs` and turn no
rule on by themselves, spreads a config's `rules` next to
`jsPlugins: ["@cunarist/eslint-plugin-explicit-types"]`.

**No rule takes settings.** None has needed one. Where memona hardcoded a
project denylist (the `EventTarget` ban in `restricted-types`), the rule is
dropped rather than shipped as an option.

### Verified environment facts

Checked empirically against Oxlint 1.87 (Vite+ 1.1.0), ESLint 9.39, and
`@typescript-eslint/parser` 8.71:

- Both hosts hand rules a TypeScript-ESTree tree. String literals are node type
  **`Literal`** with a `.value`.
- `TSESTree` node `type`s are a string enum, but comparing one to a string
  literal (`node.type === "Literal"`) type-checks.
- Abstract members are **`TSAbstractMethodDefinition`** and
  **`TSAbstractPropertyDefinition`**, not `MethodDefinition` and
  `PropertyDefinition`. A rule matching one must match both.
- An overload signature or abstract method is a `TSEmptyBodyFunctionExpression`
  under its method node, and interface methods are `TSMethodSignature`. A rule
  walking functions must include both or they slip through.
- `MethodDefinition` needs no visitor of its own: its `value` is visited in its
  own right, so adding one double reports.
- `Property` covers destructuring as well as object literals. Check
  `node.parent.type === "ObjectExpression"` to tell a declared key from a bound
  name.
- `TSParameterProperty` wraps the parameter; the type annotation's parent is
  still the inner `Identifier`, with `optional` populated.
- **`AccessorProperty` type annotations are walked** by both hosts, unlike Deno.
  `accessor a?: T` does not parse under Oxlint.
- Oxlint's parser rejects a required parameter after an optional one, so test
  snippets must be valid TypeScript, not just valid syntax.
- Oxlint's `RuleTester` counts **columns from 0**, ESLint's from 1.
- ESLint's `RuleTester` parses as TypeScript only when given a `.ts` filename
  with `@typescript-eslint/parser`; the harness sets both.
- The type systems do not meet: `@eslint/core`'s `RuleDefinition` is not
  assignable to Oxlint's `Rule` (`meta.docs` lacks an index signature; the
  `sourceCode` shapes differ), and `@typescript-eslint/utils`' `RuleModule` fits
  neither. Oxlint runs ESLint rules unchanged at runtime; the harness bridges the
  types in one documented place.
- Oxlint loads a `.ts` plugin from a relative path directly on Node 24, `#`
  imports and a JSON import of `package.json` included.
- Oxlint and Oxfmt respect `.gitignore`; that is the only reason `dist/` and
  `node_modules/` are not linted.

### Docs gotcha

`vp fmt` reformats Markdown, tables included. Keep ` ```ts ` examples valid at
top level; wrap a bare `readonly` or `private` modifier in a `class … { }` body.

### Integration testing

Unit tests run rules through both `RuleTester`s; that is not the deployment
path. Before release, `vp pack`, `npm pack`, install the tarball into
_separate_ consumer projects, and lint a deliberately-bad file and a known-good
one — once with `vp lint` and `jsPlugins`, once with ESLint 9 and
`configs.recommended`. On the sibling Lit plugin that check caught two bugs 313
unit tests missed.

---

## Rule inventory

Status: `mem` = ported from memona's plugin, `std` = written in memona's
`coding-standards.md` but never enforced, `new` = neither, added here.

15 rules, three presets.

### Preset: `concrete` — write the type out

`restricted-types` was one mega-rule in memona; it is split here so each ban is
individually nameable and disableable.

| Rule                     | Src | Enforces                                                 |
| ------------------------ | --- | -------------------------------------------------------- |
| `no-utility-types`       | mem | No `Partial`/`Record`/`ReturnType`/… — 22 built-ins      |
| `no-keyof`               | mem | No `keyof` in a type position                            |
| `no-typeof-type`         | mem | No `typeof x` in a type position (`TSTypeQuery`)         |
| `no-mapped-types`        | mem | No `{ [K in T]: … }`                                     |
| `no-index-signatures`    | mem | No `{ [k: string]: … }` — use concrete fields or a `Map` |
| `no-inline-object-types` | new | No unnamed object shape in a type position               |
| `no-conditional-types`   | new | No `T extends U ? A : B`, no `infer`                     |
| `require-return-type`    | new | Named functions declare their return type                |
| `no-type-assertion`      | std | No `x as T` / `<T>x`; `as const` is allowed              |

### Preset: `naming` — names carry the contract

| Rule                         | Src | Enforces                                                    |
| ---------------------------- | --- | ----------------------------------------------------------- |
| `pascal-case-types`          | mem | Class, interface, type alias, and enum names are PascalCase |
| `upper-snake-string-unions`  | mem | String literals in any union type are UPPER_SNAKE_CASE      |
| `no-upper-snake-object-keys` | new | No UPPER_SNAKE_CASE object keys or type members             |
| `no-enum`                    | new | No `enum` — use an UPPER_SNAKE_CASE string union            |

These three interlock. `no-enum` removes the construct;
`upper-snake-string-unions` governs the string union that replaces it; and
`no-upper-snake-object-keys` stops those UPPER_SNAKE_CASE members from being
turned back into a lookup table — an object is a struct, so a union-keyed lookup
must be a `switch` function, which fails to compile when a member is added.

**`no-upper-snake-object-keys` was narrowed after being tried on `../memona`.**
It originally demanded camelCase keys outright, which produced over a hundred
reports on names nobody there had chosen: custom element tags (HTML requires the
hyphen), `data-*` attributes, HTTP headers, ProseMirror keymaps and command
names, `$`-prefixed library APIs, and this package's own AST visitor keys. All
of them are foreign vocabularies rather than lookup tables. Restricting the rule
to UPPER_SNAKE_CASE — the casing `upper-snake-string-unions` itself prescribes —
keeps the intended target and clears every one of those, and it let the
`deno-lint-ignore-file` lines come out of this repo's own rule files.

Under Deno the rule divided cleanly with the built-in `camelcase`, which
reported unquoted `snake_case` keys. Oxlint ships no `camelcase` rule, so that
coverage is missing until a replacement lands — an open follow-up, not a
decision. Widening this rule to cover `snake_case` is not the fix: it would
reopen the foreign-vocabulary problem above.

`upper-snake-string-unions` visits `TSUnionType` rather than
`TSTypeAliasDeclaration`, so a union written inline on an interface member
(`type: "Directory" | "File"`) is held to the same casing as an aliased one.
Checking only aliases left that entire shape unguarded.

### Preset: `absence` — absence is authored

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

**`no-optional-members` was built and then dropped.** It banned `?` on members
outright, forcing `T | null`, on the argument that an optional field can be left
out so adding one compiles silently at every construction site while `| null`
makes it an error there. That is a real property, and the uniform object shape
it produces is what lets an engine hold one hidden class per object. It was cut
because `?` is shorter and reads better, and because forcing `| null` onto
members demands a normalising layer wherever JSON is parsed — a missing key is
`undefined` at runtime, so the declared type is otherwise false. Wanting it back
means writing it again; it was one `TSPropertySignature`/`TSMethodSignature`/
`PropertyDefinition` visitor on `.optional`, plus a source-text read for
`AccessorProperty`.

Earlier drafts exempted parameters from `no-undefined-type`, on the grounds that
a callback's shape is fixed by a library. That exemption turned out to be
unnecessary: `?` already satisfies those signatures — a Lit `ref` handler is
`(el?: Element) => void` — so the keyword can be banned outright and `?` is the
replacement. Checked against `../memona`, where `?:` appears 312 times across 70
files: every one is a member or a callback parameter, and all of them stay
legal.

The one case with no `?` form is a required parameter that must accept absence
in a non-trailing position, since `f(a?: number, b: string)` does not compile.
`| null` covers it.

Removing the exemption made the rule a bare `TSUndefinedKeyword` visitor, and it
immediately fired on this repo's own `identifierName` helper. The fix is the
rule's own prescription, and the second step came from `no-optional-null`:
`node: Identifier | null | undefined` → `node?: Identifier | null` →
`node: Identifier | null`.

**`accessor` fields were a blind spot under Deno and no longer are.** Deno's
lint AST never walked an `AccessorProperty` type annotation, so
`accessor a: string | undefined` passed; a source-text scanner was written to
close the gap and deleted as not worth ~90 lines of tokenizing. Oxlint walks the
annotation, so `no-undefined-type` now reports it with no extra code.
`accessor a?: string | null` does not parse under Oxlint, so `no-optional-null`
has nothing to see there.

## Where the through-line stops

Indexed access — `Config["host"]` — derives a type from another type exactly as
`keyof` does, and it is **not** banned. That is a decision, not an oversight.

The rules govern types you write. They cannot govern types someone else already
wrote, and a codebase has to name those to consume them. When a library hands
you a map-shaped field, indexed access is the only way to refer to it without
re-declaring a shape you do not own:

```ts
// a library's type, not yours
interface Options {
  retries: Record<string, number>;
}

const r: Record<string, number> = opts.retries; // no-utility-types
const r: { [k: string]: number } = opts.retries; // no-index-signatures
const r: Options["retries"] = opts.retries; // the way through
```

So the split is **authorship**: a type you declare gets written out; a type you
are handed gets reached into. Banning indexed access would leave no legal way to
name the second kind.

This package hits the same wall, which is how the gap was found. Typing a rule
record against Deno's plugin API (and now Oxlint's, the same way):

| Annotation                        | Result                      |
| --------------------------------- | --------------------------- |
| `Record<string, Deno.lint.Rule>`  | `no-utility-types`          |
| `{ [k: string]: Deno.lint.Rule }` | `no-index-signatures`       |
| none                              | JSR `missing-explicit-type` |
| `Deno.lint.Plugin["rules"]`       | the only one that passes    |

This port avoids the question with `Map`s for its own rule records, and still
reaches into library types the same way where it must:
`InvalidTestCase["errors"]` from ESLint's `RuleTester` in the test harness.

All four were checked. So the line is: **named transformations** (`keyof`,
`typeof`, utility types, mapped types) are banned; picking a single field out of
a type is not. If a `no-indexed-access` rule is ever proposed, this is why it
was not written — it would close the only door out of someone else's types.

`no-unknown` was removed for the same class of reason. TypeScript allows only
`any` or `unknown` on a `catch` binding, so banning `unknown` while the README
recommends `no-explicit-any` left no way to annotate a caught error — and
`unknown` is the safer of the two, since `any` disables checking and spreads to
everything it touches.

## Ways of being implicit that are left alone

Checked against a real `deno lint` run before the port; each is a decision, not an oversight.

- **Template literal types** — `` type Path = `FILE_${Token}` ``. Same defect as
  a mapped type: the reader has to expand it. Left out because it shows up
  almost entirely in library `.d.ts` files rather than app code, and the common
  `` `on${Capitalize<K>}` `` form already trips `no-utility-types`.
- **An exported const with no annotation** — `export const d = { retries: 3 }`.
  Note that Deno's `no-slow-types` does **not** cover this: verified that it
  needs `name`/`exports` in `deno.json` to run at all, and even then it reports
  only missing return types, not object literals. So this really is uncovered —
  it is skipped for noise, not because something else catches it.
- **A class field with no annotation** — `class E { retries = 3 }`. Rust, the
  usual comparison, does require struct field types; it infers _local
  variables_. But a field initialiser is normally one obvious line, so the "read
  the whole body" argument behind `require-return-type` does not carry over.

Confirmed closed, for the record: angle-bracket assertions, `typeof import(…)`,
and the `as const` object used as a fake enum (`typeof F[keyof typeof F]` trips
`no-typeof-type` and `no-keyof`).

## Deliberately excluded

- **The whole `disciplined` preset**, dropped after it was built: `no-readonly`,
  `no-undefined-return`, `no-default-export`, `no-namespace-import`,
  `no-parameter-destructuring`, `no-private-modifier`, `no-line-lint-ignore`.
  These are conventions about how code is arranged, not about whether a type is
  written out — a different plugin's job. The implementations, docs, and 68
  tests are **gone**: history was squashed to a single commit afterwards, so
  they survive in no branch and no clone. Wanting them back means writing them
  again from memona's `restricted-types` and `coding-standards.md`. The rule
  names above are the whole inventory; the non-obvious parts of the work are
  kept as environment facts below. One of the seven has since come back in a
  wider form: `no-undefined-return` is superseded by the `absence` preset's
  `no-undefined-type`, which covers every type position rather than only
  returns.
- `no-unknown` — dropped after it shipped; see above.
- `no-satisfies` — also dropped after it shipped. It was banned for leaving the
  declaration's own type inferred, and the doc claimed an annotation plus
  `as const` recovered what it offered. Checked: it does not. An annotation
  widens the declaration to the named type, so `a.typo` compiles against an
  index signature; `as const` keeps the literal shape but checks nothing. Only
  `satisfies` does both, and it writes the constraint at the site rather than
  deriving it, which is what the through-line asks for.
- The `EventTarget` ban from memona's `restricted-types` — a memona-specific
  architectural rule, and unconfigurable here.
- `no-any` and non-null-assertion bans — Oxlint already ships
  `typescript/no-explicit-any` and `typescript/no-non-null-assertion`.
  Recommend those in the README instead of
  duplicating them.
- Anything Lit-specific — that is `deno-lint-plugin-lit`'s job.

## Documentation

Every rule gets a `.md` beside it with exactly these sections:

````markdown
# rule-name

One or two sentences. Start with "Rejects …" or "Requires …".

## Why

Prose. Not a restatement of the rule — the concrete failure it prevents, then
why the alternative removes that failure structurally.

## Examples

One ```ts block containing `// BAD` then `// GOOD`. Minimal code.

## Notes

Bullets covering the edges: what it deliberately does not fire on, what variants
it does catch, what it cannot see. These double as the test list.
````

`README.md` links to each of these and never repeats them; per preset it carries
one paragraph of philosophy, one representative BAD/GOOD, and a table of
`rule → what it catches`. No contributor-facing content — library users only.
