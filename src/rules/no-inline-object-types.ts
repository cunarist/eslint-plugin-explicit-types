import type { TSESTree } from "@typescript-eslint/types";

import { docsUrl, type ExplicitRule } from "#helpers";

/**
 * The alias this shape is the whole body of, `type A = { a: string }`, if it
 * has members. Such an alias can be rewritten as an `interface` in place; an
 * empty shape is left alone, since `interface A {}` reads as a mistake.
 */
function convertibleAlias(node: TSESTree.TSTypeLiteral): TSESTree.TSTypeAliasDeclaration | null {
  const parent = node.parent;
  if (parent.type !== "TSTypeAliasDeclaration" || parent.typeAnnotation !== node) {
    return null;
  }
  return node.members.length > 0 ? parent : null;
}

/**
 * `no-inline-object-types` — rejects an object shape written inline in a type
 * position, `{ a: string }`.
 *
 * A shape with no name cannot be referenced, documented, or found. Declaring it
 * as an `interface` gives the same shape a name that error messages, imports,
 * and the next reader can all use.
 */
export const noInlineObjectTypesRule: ExplicitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow inline object type literals",
      url: docsUrl("no-inline-object-types"),
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      inlineObjectType:
        "Inline object type. Declare an `interface` and use its name here, so the shape can be referenced and documented.",
      convertToInterface: "Declare this alias as an `interface`.",
    },
  },
  create(context) {
    return {
      TSTypeLiteral(node: TSESTree.TSTypeLiteral): void {
        const alias = convertibleAlias(node);
        if (alias === null) {
          context.report({ node, messageId: "inlineObjectType" });
          return;
        }
        // A suggestion, not a fix: an interface is not assignable to an index
        // signature the way an alias is, and it merges with a same-named
        // declaration, so the rewrite can change what type-checks.
        const head = alias.typeParameters ?? alias.id;
        context.report({
          node,
          messageId: "inlineObjectType",
          suggest: [
            {
              messageId: "convertToInterface",
              fix: (fixer) => [
                fixer.replaceTextRange(
                  [alias.range[0], alias.id.range[0]],
                  alias.declare ? "declare interface " : "interface ",
                ),
                fixer.replaceTextRange([head.range[1], node.range[0]], " "),
                fixer.removeRange([node.range[1], alias.range[1]]),
              ],
            },
          ],
        });
      },
    };
  },
};
