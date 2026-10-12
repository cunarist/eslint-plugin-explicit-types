import type { TSESTree } from "@typescript-eslint/types";

import { docsUrl, type ExplicitRule, keyText } from "#helpers";

/** The `?`-marked binding a type annotation belongs to, if it is one. */
function optionalBinding(annotation: TSESTree.TSTypeAnnotation): TSESTree.Node | null {
  const owner = annotation.parent;
  switch (owner.type) {
    case "Identifier":
      return owner.optional ? owner : null;
    case "TSPropertySignature":
    case "PropertyDefinition":
    case "TSAbstractPropertyDefinition":
      return owner.optional ? owner.key : null;
    default:
      return null;
  }
}

/**
 * `no-optional-null` — rejects a binding that is both marked `?` and unioned
 * with `null`.
 *
 * `?` already means the value can be absent, so adding `| null` gives two ways
 * to say the same thing and leaves the reader two cases to handle for one
 * condition.
 */
export const noOptionalNull: ExplicitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Rejects a binding that is both marked `?` and unioned with `null`.",
      url: docsUrl("absence", "no-optional-null"),
    },
    schema: [],
    messages: {
      named:
        "Optional `{{name}}` also admits `null`. Drop the `| null`, or drop the `?` so absence has to be written on purpose.",
      unnamed:
        "Optional binding also admits `null`. Drop the `| null`, or drop the `?` so absence has to be written on purpose.",
    },
  },
  create(context) {
    return {
      TSNullKeyword(node: TSESTree.TSNullKeyword): void {
        const parent = node.parent;
        // Step past a union so `T | null` reads as the annotation itself.
        const annotation = parent.type === "TSUnionType" ? parent.parent : parent;
        if (annotation.type !== "TSTypeAnnotation") return;
        const binding = optionalBinding(annotation);
        if (binding === null) return;
        const name = binding.type === "Identifier" ? binding.name : keyText(binding);
        if (name === null) {
          context.report({ node, messageId: "unnamed" });
          return;
        }
        context.report({ node, messageId: "named", data: { name } });
      },
    };
  },
};
