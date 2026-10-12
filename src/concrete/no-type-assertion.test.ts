import { describe } from "vite-plus/test";

import { spanOf, testRule } from "#testing";

import { noTypeAssertion } from "./no-type-assertion.ts";

const AS = { messageId: "asAssertion" };
const ANGLE = { messageId: "angleBracketAssertion" };

describe("no-type-assertion: allows narrowing and annotations", () => {
  testRule("no-type-assertion", noTypeAssertion, {
    valid: [
      "const el: HTMLInputElement | null = null;",
      'if (typeof x === "string") { use(x); }',
      "if (node instanceof HTMLElement) { use(node); }",
    ],
    invalid: [],
  });
});

describe("no-type-assertion: allows as const", () => {
  testRule("no-type-assertion", noTypeAssertion, {
    valid: [
      'const modes = ["READ", "WRITE"] as const;',
      'const config = { host: "a" } as const;',
      'const a = "READ" as const;',
    ],
    invalid: [],
  });
});

describe("no-type-assertion: ignores non-null assertions", () => {
  testRule("no-type-assertion", noTypeAssertion, {
    valid: ["const a = value!;"],
    invalid: [],
  });
});

describe("no-type-assertion: rejects an as assertion", () => {
  testRule("no-type-assertion", noTypeAssertion, {
    valid: [],
    invalid: [
      { code: "const el = node as HTMLInputElement;", errors: [AS] },
      { code: "call(value as string);", errors: [AS] },
      { code: "function f(): void { return x as void; }", errors: [AS] },
    ],
  });
});

describe("no-type-assertion: rejects the angle-bracket form", () => {
  testRule("no-type-assertion", noTypeAssertion, {
    valid: [],
    invalid: [
      { code: "const n = <number> input;", errors: [ANGLE] },
      { code: "const s = <HTMLElement> node;", errors: [ANGLE] },
    ],
  });
});

describe("no-type-assertion: rejects an assertion to a type named Const", () => {
  testRule("no-type-assertion", noTypeAssertion, {
    valid: [],
    invalid: [{ code: "const a = value as Const;", errors: [AS] }],
  });
});

describe("no-type-assertion: reports each link of a double assertion", () => {
  testRule("no-type-assertion", noTypeAssertion, {
    valid: [],
    invalid: [{ code: "const a = value as unknown as Target;", errors: [AS, AS] }],
  });
});

const asCode = "const el = node as HTMLInputElement;";
describe("no-type-assertion: highlights the whole as expression", () => {
  testRule("no-type-assertion", noTypeAssertion, {
    valid: [],
    invalid: [{ code: asCode, errors: [{ ...AS, ...spanOf(asCode, "node as HTMLInputElement") }] }],
  });
});

const angleCode = "const n = <number> input;";
describe("no-type-assertion: highlights the whole angle-bracket expression", () => {
  testRule("no-type-assertion", noTypeAssertion, {
    valid: [],
    invalid: [{ code: angleCode, errors: [{ ...ANGLE, ...spanOf(angleCode, "<number> input") }] }],
  });
});
