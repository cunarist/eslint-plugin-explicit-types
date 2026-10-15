import { spanOf, testRule } from "#testing";

import { noUtilityTypesRule } from "./no-utility-types.ts";

/** Every built-in utility type the rule rejects. */
const UTILITY_TYPE_NAMES: readonly string[] = [
  "Awaited",
  "Partial",
  "Required",
  "Readonly",
  "Record",
  "Pick",
  "Omit",
  "Exclude",
  "Extract",
  "NonNullable",
  "Parameters",
  "ConstructorParameters",
  "ReturnType",
  "InstanceType",
  "ThisParameterType",
  "OmitThisParameter",
  "ThisType",
  "NoInfer",
  "Uppercase",
  "Lowercase",
  "Capitalize",
  "Uncapitalize",
];

const UTILITY = { messageId: "utilityType" };

const highlighted = "type A = Partial<Article>;";

testRule("no-utility-types", noUtilityTypesRule, {
  valid: [
    // allows ordinary type references
    "type A = Article;",
    "let m: Map<string, number>;",
    "interface B { title: string }",

    // ignores values that share a utility name
    "const Record = 1;",
    "Partial(x);",
    "const x = { Omit: 1 };",
  ],
  invalid: [
    // rejects each of the 22 built-ins
    ...UTILITY_TYPE_NAMES.map((name) => ({
      code: `type A = ${name}<B>;`,
      errors: [{ ...UTILITY, data: { name } }],
    })),

    // rejects a qualified reference by its tail
    { code: "type A = ns.Partial<B>;", errors: [UTILITY] },
    { code: "type A = deep.ns.ReturnType<B>;", errors: [UTILITY] },

    // fires in every type position
    { code: "function f(x: Partial<A>): void {}", errors: [UTILITY] },
    { code: "function f(): Omit<A, 'b'> {}", errors: [UTILITY] },
    { code: "interface A { field: Record<string, number> }", errors: [UTILITY] },
    { code: "let x: Map<string, Partial<A>>;", errors: [UTILITY] },

    // highlights the whole type reference
    { code: highlighted, errors: [{ ...UTILITY, ...spanOf(highlighted, "Partial<Article>") }] },

    // fixes Readonly over an array or tuple to the readonly operator
    {
      code: "type A = Readonly<string[]>;",
      output: "type A = readonly string[];",
      errors: [UTILITY],
    },
    {
      code: "function f(xs: Readonly<[string, number]>): void {}",
      output: "function f(xs: readonly [string, number]): void {}",
      errors: [UTILITY],
    },
    {
      code: "type A = Readonly<string[]> | null;",
      output: "type A = readonly string[] | null;",
      errors: [UTILITY],
    },

    // parenthesizes the readonly operator where it would bind too loosely
    {
      code: "type A = Readonly<string[]>[];",
      output: "type A = (readonly string[])[];",
      errors: [UTILITY],
    },
    {
      code: 'type A = Readonly<string[]>["length"];',
      output: 'type A = (readonly string[])["length"];',
      errors: [UTILITY],
    },

    // fixes a string intrinsic over a string literal to the literal it yields
    { code: 'type A = Uppercase<"draft">;', output: 'type A = "DRAFT";', errors: [UTILITY] },
    { code: "type A = Lowercase<'DRAFT'>;", output: 'type A = "draft";', errors: [UTILITY] },
    { code: 'type A = Capitalize<"draft">;', output: 'type A = "Draft";', errors: [UTILITY] },
    { code: 'type A = Uncapitalize<"Draft">;', output: 'type A = "draft";', errors: [UTILITY] },

    // leaves alone what syntax cannot rewrite exactly
    { code: "type A = ns.Readonly<string[]>;", errors: [UTILITY] },
    { code: "type A = Readonly</* list */ string[]>;", errors: [UTILITY] },
    { code: "type A = Uppercase<string>;", errors: [UTILITY] },
    { code: 'type A = Uppercase<"draft" | "done">;', errors: [UTILITY] },
    { code: "type A = Uppercase<`draft`>;", errors: [UTILITY] },

    // leaves a union member alone, so the result cannot break upper-snake-string-unions
    { code: 'type A = Lowercase<"DRAFT"> | "DONE";', errors: [UTILITY] },

    // names the utility in the message
    {
      code: "type A = ReturnType<B>;",
      errors: [{ message: /'ReturnType'/u }],
    },
  ],
});
