import type { TSESTree } from "@typescript-eslint/types";

import { docsUrl, type ExplicitRule } from "#helpers";

/** A name that starts uppercase and carries no underscores. */
const PASCAL_CASE_PATTERN = /^[A-Z][A-Za-z0-9]*$/u;

/**
 * `pascal-case-types` — requires class, interface, type alias, and enum
 * declaration names to be PascalCase.
 *
 * A type's name is the only part of it most readers ever see. PascalCase is the
 * one signal that a bare identifier denotes a type rather than a value, so a
 * name that breaks the convention makes every use site ambiguous.
 */
export const pascalCaseTypesRule: ExplicitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Enforce PascalCase names for classes, interfaces, type aliases, and enums",
      url: docsUrl("pascal-case-types"),
    },
    schema: [],
    messages: {
      notPascalCase:
        "{{kind}} name `{{name}}` is not PascalCase. Start the name with an uppercase letter and drop underscores, e.g. `UserProfile`.",
    },
  },
  create(context) {
    /** Report an identifier whose name is not PascalCase. */
    function check(identifier: TSESTree.Identifier | null, kind: string): void {
      if (identifier === null) {
        return;
      }
      if (PASCAL_CASE_PATTERN.test(identifier.name)) {
        return;
      }
      context.report({
        node: identifier,
        messageId: "notPascalCase",
        data: { kind, name: identifier.name },
      });
    }

    return {
      ClassDeclaration(node: TSESTree.ClassDeclaration): void {
        check(node.id, "Class");
      },
      ClassExpression(node: TSESTree.ClassExpression): void {
        check(node.id, "Class");
      },
      TSInterfaceDeclaration(node: TSESTree.TSInterfaceDeclaration): void {
        check(node.id, "Interface");
      },
      TSTypeAliasDeclaration(node: TSESTree.TSTypeAliasDeclaration): void {
        check(node.id, "Type alias");
      },
      TSEnumDeclaration(node: TSESTree.TSEnumDeclaration): void {
        check(node.id, "Enum");
      },
    };
  },
};
