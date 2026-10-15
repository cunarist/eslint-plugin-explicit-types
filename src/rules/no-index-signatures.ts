import type { TSESTree } from "@typescript-eslint/types";

import { docsUrl, type ExplicitRule } from "#helpers";

/**
 * `no-index-signatures` — rejects index signatures — `{ [key: string]: T }`.
 *
 * An index signature says every key is legal and every read succeeds. Typos
 * type-check, and the object doubles as a dictionary that is not a `Map`.
 */
export const noIndexSignaturesRule: ExplicitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow index signatures",
      url: docsUrl("no-index-signatures"),
    },
    schema: [],
    messages: {
      indexSignature:
        "Index signature. Write concrete fields, or use a `Map` if the keys are genuinely dynamic.",
    },
  },
  create(context) {
    return {
      TSIndexSignature(node: TSESTree.TSIndexSignature): void {
        context.report({ node, messageId: "indexSignature" });
      },
    };
  },
};
