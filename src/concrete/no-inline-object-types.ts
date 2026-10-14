import type { TSESTree } from "@typescript-eslint/types";

import { docsUrl, type ExplicitRule } from "#helpers";

/**
 * `no-inline-object-types` — rejects an object shape written inline in a type
 * position, `{ a: string }`.
 *
 * A shape with no name cannot be referenced, documented, or found. Declaring it
 * as an `interface` gives the same shape a name that error messages, imports,
 * and the next reader can all use.
 */
export const noInlineObjectTypes: ExplicitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Rejects an object shape written inline in a type position.",
      url: docsUrl("no-inline-object-types"),
    },
    schema: [],
    messages: {
      inlineObjectType:
        "Inline object type. Declare an `interface` and use its name here, so the shape can be referenced and documented.",
    },
  },
  create(context) {
    return {
      TSTypeLiteral(node: TSESTree.TSTypeLiteral): void {
        context.report({ node, messageId: "inlineObjectType" });
      },
    };
  },
};
