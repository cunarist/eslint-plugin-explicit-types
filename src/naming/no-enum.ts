import type { TSESTree } from "@typescript-eslint/types";

import { docsUrl, type ExplicitRule } from "#helpers";

/**
 * `no-enum` — rejects every `enum` declaration, including `const enum` and string enums.
 *
 * An `enum` is the one TypeScript type that emits a runtime value, and its
 * members are opaque at the boundary: a numeric enum serializes as a number
 * nobody can read, and the declaration must be imported everywhere the value is
 * named. A string union is the same closed set with none of that.
 */
export const noEnum: ExplicitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Rejects every `enum` declaration, including `const enum` and string enums.",
      url: docsUrl("no-enum"),
    },
    schema: [],
    messages: {
      enum: 'Enum `{{name}}` declares a runtime value. Use an UPPER_SNAKE_CASE string union type instead, e.g. `type Status = "OPEN" | "CLOSED";`.',
    },
  },
  create(context) {
    return {
      TSEnumDeclaration(node: TSESTree.TSEnumDeclaration): void {
        context.report({
          node: node.id,
          messageId: "enum",
          data: { name: node.id.name },
        });
      },
    };
  },
};
