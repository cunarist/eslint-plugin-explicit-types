/**
 * Shared harness for rule tests: every case runs under both ESLint's and
 * Oxlint's `RuleTester`, wired into Vitest.
 *
 * Imported only by `*.test.ts` files, never by the plugin, so neither tester
 * ends up in the published bundle. No ESLint config file is involved: each
 * tester is configured here.
 */

import tsParser from "@typescript-eslint/parser";
import { RuleTester as EslintRuleTester } from "eslint";
import { RuleTester as OxlintRuleTester } from "vite-plus/lint/plugins-dev";
import { describe, it } from "vite-plus/test";

import type { ExplicitRule } from "#helpers";

EslintRuleTester.describe = describe;
EslintRuleTester.it = it;
EslintRuleTester.itOnly = it.only;
OxlintRuleTester.describe = (text, fn) => {
  describe(text, fn);
};
OxlintRuleTester.it = it;

/**
 * CI names the runtime each matrix leg means to test on, `node` or `bun`, in
 * `TEST_RUNTIME`. Fail every test file if the tests landed on the other one,
 * so a Bun leg cannot pass by quietly running on Node.
 */
const expectedRuntime = process.env["TEST_RUNTIME"];
const actualRuntime: string = "Bun" in globalThis ? "bun" : "node";
if (typeof expectedRuntime === "string" && expectedRuntime !== actualRuntime) {
  throw new Error(`tests run on ${actualRuntime}, not ${expectedRuntime}`);
}

/** The filename every snippet is linted as, so both parsers read TypeScript. */
const FILENAME = "example.ts";

const eslintTester = new EslintRuleTester({
  languageOptions: { parser: tsParser },
});

/**
 * Oxlint's tester, seen through the one method this harness calls.
 *
 * Oxlint types `run` against its own `Rule`, which ESLint's `RuleDefinition`
 * does not satisfy on paper — `meta.docs` lacks an index signature and the
 * two `sourceCode` shapes differ — although Oxlint runs ESLint rules as they
 * are. Widening the parameter here is the one place the two type systems are
 * bridged; the Oxlint half of every test is what proves the runtime agrees.
 */
interface OxlintRunner {
  run(name: string, rule: unknown, cases: OxlintRuleTester.TestCases): void;
}

const oxlintTester: OxlintRunner = new OxlintRuleTester({
  languageOptions: { parserOptions: { lang: "ts" } },
});

/** The cases one rule is tested against, written in ESLint's shape. */
export interface RuleCases {
  valid: string[];
  invalid: EslintRuleTester.InvalidTestCase[];
}

/**
 * Where a diagnostic should land, counted the way ESLint counts: lines and
 * columns both from 1. The Oxlint run shifts columns to its 0-based count.
 */
export interface ReportedSpan {
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
}

/**
 * The span of the first occurrence of `text` in `code`. A rule can fire
 * correctly while highlighting the wrong characters; this is what catches that.
 */
export function spanOf(code: string, text: string): ReportedSpan {
  const start = code.indexOf(text);
  if (start === -1) {
    throw new Error(`${JSON.stringify(text)} is not in the code`);
  }
  const begin = position(code, start);
  const end = position(code, start + text.length);
  return {
    line: begin.line,
    column: begin.column,
    endLine: end.line,
    endColumn: end.column,
  };
}

/** A line and column within source text. */
interface Position {
  line: number;
  column: number;
}

/** The 1-indexed line and 1-indexed column of an offset. */
function position(code: string, offset: number): Position {
  const before = code.slice(0, offset).split("\n");
  return {
    line: before.length,
    column: (before.at(-1)?.length ?? 0) + 1,
  };
}

/**
 * Run one rule over all its valid and invalid snippets, under ESLint and
 * Oxlint. Each rule's test file calls this once. The suites nest as
 * `<rule> > eslint|oxlint`, so a full test name contains ` eslint ` or
 * ` oxlint `, which is what CI filters each host's step by.
 */
export function testRule(name: string, rule: ExplicitRule, cases: RuleCases): void {
  describe(name, () => {
    describe("eslint", () => {
      eslintTester.run(name, rule, {
        valid: cases.valid.map((code) => ({ code, filename: FILENAME })),
        invalid: cases.invalid.map((test) => ({ ...test, filename: FILENAME })),
      });
    });
    describe("oxlint", () => {
      oxlintTester.run(name, rule, {
        valid: cases.valid,
        invalid: cases.invalid.map((test) => ({
          code: test.code,
          errors: oxlintErrors(test.errors),
        })),
      });
    });
  });
}

/** ESLint's expected errors, with columns shifted to Oxlint's 0-based count. */
function oxlintErrors(
  errors: EslintRuleTester.InvalidTestCase["errors"],
): OxlintRuleTester.InvalidTestCase["errors"] {
  if (typeof errors === "number") {
    return errors;
  }
  return errors.map((error) => {
    if (typeof error === "string") {
      return error;
    }
    const shifted: OxlintRuleTester.Error = { ...oxlintMessage(error) };
    if (error.line !== undefined) {
      shifted.line = error.line;
    }
    if (error.endLine !== undefined) {
      shifted.endLine = error.endLine;
    }
    if (error.column !== undefined) {
      shifted.column = error.column - 1;
    }
    if (error.endColumn !== undefined) {
      shifted.endColumn = error.endColumn - 1;
    }
    return shifted;
  });
}

/** The message half of an expected error, which both testers read alike. */
function oxlintMessage(error: EslintRuleTester.TestCaseError): OxlintRuleTester.Error {
  if (error.messageId !== undefined) {
    return error.data === undefined
      ? { messageId: error.messageId }
      : { messageId: error.messageId, data: Object.fromEntries(stringEntries(error.data)) };
  }
  if (error.message !== undefined) {
    return { message: error.message };
  }
  throw new Error("an expected error needs a messageId or a message");
}

/**
 * Placeholder data as Oxlint types it. ESLint types it `any`; every
 * placeholder in this package is a string, so anything else is a test bug.
 */
function stringEntries(data: unknown): [string, string][] {
  if (typeof data !== "object" || data === null) {
    throw new Error("data is not an object");
  }
  return Object.entries(data).map(([key, value]) => {
    if (typeof value !== "string") {
      throw new TypeError(`placeholder ${key} is not a string`);
    }
    return [key, value];
  });
}
