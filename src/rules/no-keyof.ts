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
      keyof:
        "`keyof` in a type position. Write the union of key names out, so adding a field cannot silently widen it.",
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
