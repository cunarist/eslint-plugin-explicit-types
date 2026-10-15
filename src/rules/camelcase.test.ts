import { describe, expect, it } from "vite-plus/test";

import { type ReportedSpan, type RuleCases, testRule } from "#testing";

import { camelcaseRule, isUnderscored, toCamelCase } from "./camelcase.ts";

/** One expected report, written as Deno's tests write it: a 0-based column. */
interface DenoError {
  col: number;
  name: string;
  messageId: string;
  suggestion: string;
}

/** The span of `name` at Deno's 0-based column on a one-line snippet. */
function at(col: number, name: string): ReportedSpan {
  return { line: 1, column: col + 1, endLine: 1, endColumn: col + 1 + name.length };
}

/** A `rename` report, Deno's `Consider renaming` hint. */
function rename(col: number, name: string, suggestion: string): DenoError {
  return { col, name, messageId: "rename", suggestion };
}

/** A `renameKey` report, Deno's hint to rename or quote a key. */
function renameKey(col: number, name: string, suggestion: string): DenoError {
  return { col, name, messageId: "renameKey", suggestion };
}

/** A `shorthandKey` report, Deno's hint to expand a shorthand key. */
function shorthandKey(col: number, name: string, suggestion: string): DenoError {
  return { col, name, messageId: "shorthandKey", suggestion };
}

/** An invalid case in `RuleTester` form. */
function invalid(code: string, ...errors: DenoError[]): RuleCase {
  return {
    code,
    errors: errors.map((error) => ({
      messageId: error.messageId,
      data: { name: error.name, suggestion: error.suggestion },
      ...at(error.col, error.name),
    })),
  };
}

/** The invalid-case shape `testRule` takes. */
type RuleCase = RuleCases["invalid"][number];

describe("camelcase: Deno's is_underscored", () => {
  const cases: [string, boolean][] = [
    ["foo_bar", true],
    ["fooBar", false],
    ["FooBar", false],
    ["foo_bar_baz", true],
    ["_foo_bar_baz", true],
    ["__foo_bar_baz__", true],
    ["__fooBar_baz__", true],
    ["__fooBarBaz__", false],
    ["Sha3_224", true],
    ["SHA3_224", false],
  ];
  for (const [input, expected] of cases) {
    it(input, () => {
      expect(isUnderscored(input)).toBe(expected);
    });
  }
});

describe("camelcase: Deno's to_camelcase", () => {
  const cases: [string, string][] = [
    ["foo_bar", "fooBar"],
    ["fooBar", "fooBar"],
    ["FooBar", "FooBar"],
    ["foo_bar_baz", "fooBarBaz"],
    ["_foo_bar_baz", "_fooBarBaz"],
    ["__foo_bar_baz__", "__fooBarBaz__"],
    ["Sha3_224", "SHA3_224"],
    ["SHA3_224", "SHA3_224"],
    ["_leading", "_leading"],
    ["trailing_", "trailing_"],
    ["_bothEnds_", "_bothEnds_"],
  ];
  for (const [input, expected] of cases) {
    it(input, () => {
      expect(toCamelCase(input)).toBe(expected);
    });
  }
});

describe("camelcase: Deno's valid cases from ESLint", () => {
  testRule("camelcase", camelcaseRule, {
    valid: [
      'firstName = "Ichigo"',
      'FIRST_NAME = "Ichigo"',
      '__myPrivateVariable = "Hoshimiya"',
      'myPrivateVariable_ = "Hoshimiya"',
      "function doSomething(){}",
      "do_something()",
      "new do_something",
      "new do_something()",
      "foo.do_something()",
      "var foo = bar.baz_boom;",
      "var foo = bar.baz_boom.something;",
      "foo.boom_pow.qux = bar.baz_boom.something;",
      "if (bar.baz_boom) {}",
      "var obj = { key: foo.bar_baz };",
      "var arr = [foo.bar_baz];",
      "[foo.bar_baz]",
      "var arr = [foo.bar_baz.qux];",
      "[foo.bar_baz.nesting]",
      "if (foo.bar_baz === boom.bam_pow) { [foo.baz_boom] }",
      "var o = {key: 1}",
      "var o = {_leading: 1}",
      "var o = {trailing_: 1}",
      "const { ['foo']: _foo } = obj;",
      "const { [_foo_]: foo } = obj;",
      "var { category_id: category } = query;",
      "var { _leading } = query;",
      "var { trailing_ } = query;",
      "var { or_middle } = query;",
      "var { category_id = 1 } = query;",
      "var { category_id: { property_test } } = query;",
      "const { no_camelcased = false } = bar;",
      'import { camelCased } from "external module";',
      'import { _leading } from "external module";',
      'import { trailing_ } from "external module";',
      'import { or_middle } from "external module";',
      'import { no_camelcased as camelCased } from "external-module";',
      'import { no_camelcased as _leading } from "external-module";',
      'import { no_camelcased as trailing_ } from "external-module";',
      'import { no_camelcased as camelCased, anotherCamelCased } from "external-module";',
      "import { camelCased } from 'mod'",
      "var _camelCased = aGlobalVariable",
      "var camelCased = _aGlobalVariable",
      "function foo({ no_camelcased: camelCased }) {};",
      "function foo({ no_camelcased: _leading }) {};",
      "function foo({ no_camelcased: trailing_ }) {};",
      "function foo({ camelCased = 'default value' }) {};",
      "function foo({ _leading = 'default value' }) {};",
      "function foo({ trailing_ = 'default value' }) {};",
      "function foo({ camelCased }) {};",
      "function foo({ _leading }) {}",
      "function foo({ trailing_ }) {}",
      "({obj} = baz.fo_o);",
      "([obj] = baz.fo_o);",
      "([obj.foo = obj.fo_o] = bar);",
      "const f = function camelCased() {};",
      "const c = class camelCased {};",
      "class camelCased {};",
    ],
    invalid: [],
  });
});

describe("camelcase: Deno's deliberate departures from ESLint stay valid", () => {
  testRule("camelcase", camelcaseRule, {
    valid: [
      'first_name = "Akari"',
      '__private_first_name = "Akari"',
      "obj.foo_bar = function(){};",
      "bar_baz.foo = function(){};",
      "[foo_bar.baz]",
      "if (foo.bar_baz === boom.bam_pow) { [foo_bar.baz] }",
      "foo.bar_baz = boom.bam_pow",
      "foo.qux.boom_pow = { bar: boom.bam_pow }",
      "obj.a_b = 2;",
      "var { [category_id]: categoryId } = query;",
      "a_global_variable.foo()",
      "a_global_variable[undefined]",
      "var camelCased = snake_cased",
      "({ a: obj.fo_o } = bar);",
      "({ a: obj.fo_o.b_ar } = baz);",
      "({ a: { b: { c: obj.fo_o } } } = bar);",
      "({ a: { b: { c: obj.fo_o.b_ar } } } = baz);",
      "([obj.fo_o] = bar);",
      "([obj.fo_o = 1] = bar);",
      "({ a: [obj.fo_o] } = bar);",
      "({ a: { b: [obj.fo_o] } } = bar);",
      "([obj.fo_o.ba_r] = baz);",
      "obj.o_k.non_camelcase = 0",
      "(obj?.o_k).non_camelcase = 0",
      "({...obj.fo_o} = baz);",
      "({...obj.fo_o.ba_r} = baz);",
      "({c: {...obj.fo_o }} = baz);",
      "not_ignored_foo = 0;",
    ],
    invalid: [],
  });
});

describe("camelcase: allows quoted snake_case object keys", () => {
  testRule("camelcase", camelcaseRule, {
    valid: [
      'const obj = { "created_at": "2020-10-30T13:16:45+09:00" }',
      'const obj = { "created_at": created_at }',
    ],
    invalid: [],
  });
});

describe("camelcase: skips ambient declarations", () => {
  testRule("camelcase", camelcaseRule, {
    valid: [
      "declare function foo_bar(a_b: number): void;",
      "declare const foo_bar: number;",
      "declare const foo_bar: number, snake_case: string;",
      "declare let foo_bar: { some_property: string; };",
      "declare var foo_bar: number;",
      "declare class foo_bar { some_method(some_param: boolean): string; };",
      "export declare const foo_bar: number;",
      "declare type foo_bar = { some_var: string; };",
      "declare interface foo_bar { some_var: string; }",
      "declare namespace foo_bar {}",
      "declare enum foo_bar { variant_one, variant_two }",
    ],
    invalid: [],
  });
});

describe("camelcase: Deno's invalid cases", () => {
  testRule("camelcase", camelcaseRule, {
    valid: [],
    invalid: [
      invalid("function foo_bar(){}", rename(9, "foo_bar", "fooBar")),
      invalid("var foo = { bar_baz: boom.bam_pow }", renameKey(12, "bar_baz", "barBaz")),
      invalid("var o = { bar_baz: 1 }", renameKey(10, "bar_baz", "barBaz")),
      invalid("var o = { bar_baz }", shorthandKey(10, "bar_baz", "barBaz")),
      invalid(
        "var { category_id: category_alias } = query;",
        rename(19, "category_alias", "categoryAlias"),
      ),
      invalid("var { category_id: category_id } = query;", rename(19, "category_id", "categoryId")),
      invalid(
        'import * as no_camelcased from "external-module";',
        rename(12, "no_camelcased", "noCamelcased"),
      ),
      invalid(
        'import { no_camelcased as no_camel_cased } from "external module";',
        rename(26, "no_camel_cased", "noCamelCased"),
      ),
      invalid(
        'import { camelCased as no_camel_cased } from "external module";',
        rename(23, "no_camel_cased", "noCamelCased"),
      ),
      invalid(
        'import no_camelcased, { another_no_camelcased as camelCased } from "external-module";',
        rename(7, "no_camelcased", "noCamelcased"),
      ),
      invalid("import snake_cased from 'mod'", rename(7, "snake_cased", "snakeCased")),
      invalid("import * as snake_cased from 'mod'", rename(12, "snake_cased", "snakeCased")),
      invalid("export * as snake_cased from 'mod'", rename(12, "snake_cased", "snakeCased")),
      invalid("function foo({ no_camelcased }) {};", rename(15, "no_camelcased", "noCamelcased")),
      invalid(
        "function foo({ no_camelcased = 'default value' }) {};",
        rename(15, "no_camelcased", "noCamelcased"),
      ),
      invalid(
        "const no_camelcased = 0; function foo({ camelcased_value = no_camelcased }) {}",
        rename(6, "no_camelcased", "noCamelcased"),
        rename(40, "camelcased_value", "camelcasedValue"),
      ),
      invalid("const { bar: no_camelcased } = foo;", rename(13, "no_camelcased", "noCamelcased")),
      invalid("function foo({ value_1: my_default }) {}", rename(24, "my_default", "myDefault")),
      invalid(
        "function foo({ isCamelcased: no_camelcased }) {};",
        rename(29, "no_camelcased", "noCamelcased"),
      ),
      invalid(
        "function foo({ isCamelcased: { no_camelcased } }) {};",
        rename(31, "no_camelcased", "noCamelcased"),
      ),
      invalid("var { foo: bar_baz = 1 } = quz;", rename(11, "bar_baz", "barBaz")),
      invalid(
        "const f = function no_camelcased() {};",
        rename(19, "no_camelcased", "noCamelcased"),
      ),
      invalid("const c = class no_camelcased {};", rename(16, "no_camelcased", "NoCamelcased")),
      invalid("class no_camelcased {}", rename(6, "no_camelcased", "NoCamelcased")),
      invalid("type foo_bar = string;", rename(5, "foo_bar", "FooBar")),
      invalid("type Foo = { snake_case: number; };", renameKey(13, "snake_case", "snakeCase")),
      invalid("interface foo_bar { ok: string; };", rename(10, "foo_bar", "FooBar")),
      invalid("interface Foo { snake_case: number; };", renameKey(16, "snake_case", "snakeCase")),
      invalid("namespace foo_bar {}", rename(10, "foo_bar", "FooBar")),
      invalid("namespace FooBar { const snake_case = 42; }", rename(25, "snake_case", "snakeCase")),
      invalid("enum foo_bar { VariantOne }", rename(5, "foo_bar", "FooBar")),
      invalid("enum FooBar { variant_one }", rename(14, "variant_one", "VariantOne")),
    ],
  });
});

describe("camelcase: matches Deno where its AST differs from ESTree", () => {
  testRule("camelcase", camelcaseRule, {
    valid: [
      "const f = (a_b) => {};",
      "export default class foo_bar {}",
      "const x = ({ a_b: 1 });",
      "const x = /* a */ ( // b\n { a_b: 1 });",
      'import { a_b } from "m";',
      "const o = { set v(a_b) {} };",
      "function f<T_U>() {}",
      "type Foo<T_U> = T_U;",
      "declare global { const a_b: number }",
      "declare namespace N { function a_b(): void }",
      "try {} catch (a_b) {}",
      "for (const { a_b } of []) {}",
      "let x: { a_b: string };",
      "const o = { a: { b_c: 1 } };",
      "x = class a_b {};",
      "interface I { m(a_b: string): void }",
      "const x = { a_b: 1 } as const;",
      "const v = function a_b() {} as any;",
      "const X_Y_Z = 1;",
    ],
    invalid: [
      invalid("export default function foo_bar(c_d) {}", rename(32, "c_d", "cD")),
      invalid("interface X { [foo_bar]: string }", renameKey(15, "foo_bar", "fooBar")),
      invalid('import { a_b as a_b } from "m";', rename(16, "a_b", "aB")),
      invalid(
        "class A { constructor(private a_b: number, c_d: number) {} }",
        rename(43, "c_d", "cD"),
      ),
      invalid("class A { set v(a_b) {} }", rename(16, "a_b", "aB")),
      invalid("const o = { m(a_b) {} };", rename(14, "a_b", "aB")),
      invalid("function f(a_b: string): void;", rename(11, "a_b", "aB")),
      invalid(
        "class A { m(a_b): void; m(c_d) {} }",
        rename(12, "a_b", "aB"),
        rename(26, "c_d", "cD"),
      ),
      invalid("abstract class A { abstract m(a_b): void; }", rename(30, "a_b", "aB")),
      invalid("namespace a_b.c_d {}", rename(10, "a_b", "AB"), rename(14, "c_d", "CD")),
      invalid("module a_b {}", rename(7, "a_b", "AB")),
      invalid("for (const a_b of []) {}", rename(11, "a_b", "aB")),
      invalid(
        "type T = { m(): { a_b: string }; get g(): { c_d: number }; set s(v_w) };",
        renameKey(18, "a_b", "aB"),
        renameKey(44, "c_d", "cD"),
      ),
      invalid(
        'const o = { "a_b": 1, [c_d]: 2, e_f() {}, get g_h() { return 1 } };',
        renameKey(32, "e_f", "eF"),
        renameKey(46, "g_h", "gH"),
      ),
      invalid("let a = 1, b_c = { d_e: 1 };", rename(11, "b_c", "bC"), renameKey(19, "d_e", "dE")),
      invalid('enum E { "a_b" = 1, c_d = 2 }', rename(20, "c_d", "CD")),
      invalid("const Sha3_224 = 2;", rename(6, "Sha3_224", "SHA3_224")),
      invalid("const x = /* ( */ { a_b: 1 };", renameKey(20, "a_b", "aB")),
      invalid("export function foo_bar() {}", rename(16, "foo_bar", "fooBar")),
    ],
  });
});
