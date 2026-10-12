import { describe } from "vite-plus/test";

import { spanOf, testRule } from "#testing";

import { noTypeofType } from "./no-typeof-type.ts";

const TYPEOF = { messageId: "typeofType" };

describe("no-typeof-type: allows the runtime typeof operator", () => {
  testRule("no-typeof-type", noTypeofType, {
    valid: ['if (typeof x === "string") { run(); }', "const kind = typeof value;"],
    invalid: [],
  });
});

describe("no-typeof-type: allows a named type", () => {
  testRule("no-typeof-type", noTypeofType, {
    valid: ["function f(options: Options): void {}"],
    invalid: [],
  });
});

describe("no-typeof-type: rejects typeof in every type position", () => {
  testRule("no-typeof-type", noTypeofType, {
    valid: [],
    invalid: [
      { code: "type A = typeof defaults;", errors: [TYPEOF] },
      { code: "function f(o: typeof defaults): void {}", errors: [TYPEOF] },
      { code: "function f(): typeof defaults {}", errors: [TYPEOF] },
      { code: "interface A { field: typeof defaults }", errors: [TYPEOF] },
    ],
  });
});

describe("no-typeof-type: rejects a typeof import query", () => {
  testRule("no-typeof-type", noTypeofType, {
    valid: [],
    invalid: [{ code: 'type A = typeof import("./index.ts");', errors: [TYPEOF] }],
  });
});

describe("no-typeof-type: fires once inside keyof typeof", () => {
  testRule("no-typeof-type", noTypeofType, {
    valid: [],
    invalid: [{ code: "type A = keyof typeof defaults;", errors: [TYPEOF] }],
  });
});

const highlighted = "type A = typeof defaults;";
describe("no-typeof-type: highlights the whole query", () => {
  testRule("no-typeof-type", noTypeofType, {
    valid: [],
    invalid: [
      { code: highlighted, errors: [{ ...TYPEOF, ...spanOf(highlighted, "typeof defaults") }] },
    ],
  });
});
