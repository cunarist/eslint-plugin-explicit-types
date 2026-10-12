import { describe } from "vite-plus/test";

import { spanOf, testRule } from "#testing";

import { noUtilityTypes } from "./no-utility-types.ts";

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

describe("no-utility-types: allows ordinary type references", () => {
  testRule("no-utility-types", noUtilityTypes, {
    valid: ["type A = Article;", "let m: Map<string, number>;", "interface B { title: string }"],
    invalid: [],
  });
});

describe("no-utility-types: rejects each of the 22 built-ins", () => {
  testRule("no-utility-types", noUtilityTypes, {
    valid: [],
    invalid: UTILITY_TYPE_NAMES.map((name) => ({
      code: `type A = ${name}<B>;`,
      errors: [{ ...UTILITY, data: { name } }],
    })),
  });
});

describe("no-utility-types: rejects a qualified reference by its tail", () => {
  testRule("no-utility-types", noUtilityTypes, {
    valid: [],
    invalid: [
      { code: "type A = ns.Partial<B>;", errors: [UTILITY] },
      { code: "type A = deep.ns.ReturnType<B>;", errors: [UTILITY] },
    ],
  });
});

describe("no-utility-types: fires in every type position", () => {
  testRule("no-utility-types", noUtilityTypes, {
    valid: [],
    invalid: [
      { code: "function f(x: Partial<A>): void {}", errors: [UTILITY] },
      { code: "function f(): Omit<A, 'b'> {}", errors: [UTILITY] },
      { code: "interface A { field: Record<string, number> }", errors: [UTILITY] },
      { code: "let x: Map<string, Partial<A>>;", errors: [UTILITY] },
    ],
  });
});

describe("no-utility-types: ignores values that share a utility name", () => {
  testRule("no-utility-types", noUtilityTypes, {
    valid: ["const Record = 1;", "Partial(x);", "const x = { Omit: 1 };"],
    invalid: [],
  });
});

const highlighted = "type A = Partial<Article>;";
describe("no-utility-types: highlights the whole type reference", () => {
  testRule("no-utility-types", noUtilityTypes, {
    valid: [],
    invalid: [
      { code: highlighted, errors: [{ ...UTILITY, ...spanOf(highlighted, "Partial<Article>") }] },
    ],
  });
});

describe("no-utility-types: names the utility in the message", () => {
  testRule("no-utility-types", noUtilityTypes, {
    valid: [],
    invalid: [
      {
        code: "type A = ReturnType<B>;",
        errors: [{ message: /`ReturnType`/ }],
      },
    ],
  });
});
