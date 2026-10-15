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

    // names the utility in the message
    {
      code: "type A = ReturnType<B>;",
      errors: [{ message: /`ReturnType`/u }],
    },
  ],
});
