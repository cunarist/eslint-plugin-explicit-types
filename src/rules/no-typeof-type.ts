import type { TSESTree } from "@typescript-eslint/types";

import { docsUrl, type ExplicitRule } from "#helpers";

/**
 * `no-typeof-type` - rejects `typeof value` used in a type position.
 *
 * `typeof value` in a type position makes a type depend on an initializer.
 * Editing the value silently rewrites the contract every annotation refers to.
 */
export const noTypeofTypeRule: ExplicitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow `typeof` in type positions",
      url: docsUrl("no-typeof-type"),
    },
    schema: [],
    messages: {
      typeofType: "Unexpected `typeof` in a type position.",
    },
  },
  create(context) {
    return {
      TSTypeQuery(node: TSESTree.TSTypeQuery): void {
        context.report({ node, messageId: "typeofType" });
      },
    };
  },
};
