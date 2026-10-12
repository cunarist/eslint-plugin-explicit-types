import { describe } from "vite-plus/test";

import { spanOf, testRule } from "#testing";

import { noIndexSignatures } from "./no-index-signatures.ts";

const INDEX_SIGNATURE = { messageId: "indexSignature" };

describe("no-index-signatures: allows concrete fields and a Map", () => {
  testRule("no-index-signatures", noIndexSignatures, {
    valid: ["interface A { host: string; token: string }", "const m = new Map<string, string>();"],
    invalid: [],
  });
});

describe("no-index-signatures: ignores mapped types", () => {
  testRule("no-index-signatures", noIndexSignatures, {
    valid: ["type A = { [K in B]: string };"],
    invalid: [],
  });
});

describe("no-index-signatures: rejects the signature in each container", () => {
  testRule("no-index-signatures", noIndexSignatures, {
    valid: [],
    invalid: [
      { code: "interface A { [k: string]: string }", errors: [INDEX_SIGNATURE] },
      { code: "type A = { [k: string]: string };", errors: [INDEX_SIGNATURE] },
      { code: "class A { [k: string]: string; }", errors: [INDEX_SIGNATURE] },
    ],
  });
});

describe("no-index-signatures: rejects every key type", () => {
  testRule("no-index-signatures", noIndexSignatures, {
    valid: [],
    invalid: [
      { code: "interface A { [k: string]: number }", errors: [INDEX_SIGNATURE] },
      { code: "interface A { [k: number]: string }", errors: [INDEX_SIGNATURE] },
      { code: "interface A { [k: symbol]: string }", errors: [INDEX_SIGNATURE] },
    ],
  });
});

describe("no-index-signatures: rejects a readonly index signature once", () => {
  testRule("no-index-signatures", noIndexSignatures, {
    valid: [],
    invalid: [{ code: "interface A { readonly [k: string]: string }", errors: [INDEX_SIGNATURE] }],
  });
});

const highlighted = "interface A { [key: string]: number }";
describe("no-index-signatures: highlights the signature member", () => {
  testRule("no-index-signatures", noIndexSignatures, {
    valid: [],
    invalid: [
      {
        code: highlighted,
        errors: [{ ...INDEX_SIGNATURE, ...spanOf(highlighted, "[key: string]: number") }],
      },
    ],
  });
});
