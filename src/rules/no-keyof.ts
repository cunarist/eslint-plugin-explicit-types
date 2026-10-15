import type { TSESTree } from "@typescript-eslint/types";

import { docsUrl, type ExplicitRule } from "#helpers";

/**
 * `no-keyof` — rejects the `keyof` type operator in any type position.
 *
 * `keyof T` is a union nobody wrote down. Its members change silently whenever
 * `T` gains or loses a field, and every use site changes with it.
 */
export const noKeyofRule: ExplicitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow the `keyof` type operator",
      url: docsUrl("no-keyof"),
    },
    schema: [],
    messages: {
      keyof: "Unexpected `keyof` in a type position.",
    },
  },
  create(context) {
    return {
      TSTypeOperator(node: TSESTree.TSTypeOperator): void {
        if (node.operator !== "keyof") {
          return;
        }
        context.report({ node, messageId: "keyof" });
      },
    };
  },
};
