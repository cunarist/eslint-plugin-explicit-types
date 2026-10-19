import type { TSESTree } from "@typescript-eslint/types";

import { docsUrl, type ExplicitRule } from "#helpers";

/**
 * `no-satisfies` - rejects the `satisfies` operator.
 *
 * `value satisfies T` checks the value against `T` but leaves the
 * declaration's own type inferred: the type the variable ends up with is
 * computed from the expression, not written anywhere. An annotation on the
 * declaration writes that type out instead.
 */
export const noSatisfiesRule: ExplicitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow the `satisfies` operator",
      url: docsUrl("no-satisfies"),
    },
    schema: [],
    messages: {
      satisfies: "Add an explicit type annotation to the declaration instead of `satisfies`.",
    },
  },
  create(context) {
    return {
      TSSatisfiesExpression(node: TSESTree.TSSatisfiesExpression): void {
        context.report({ node, messageId: "satisfies" });
      },
    };
  },
};
