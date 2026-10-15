import type { TSESTree } from "@typescript-eslint/types";

import { docsUrl, type ExplicitRule, renameFix } from "#helpers";

/** A name that starts uppercase and carries no underscores. */
const PASCAL_CASE_PATTERN = /^[A-Z][A-Za-z0-9]*$/u;

/** Runs of characters between underscores. */
const UNDERSCORE_PATTERN = /_+/u;

/** `user_profile` -> `UserProfile`: each underscore-separated segment capitalized. */
function toPascalCase(name: string): string {
  return name
    .split(UNDERSCORE_PATTERN)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join("");
}

/**
 * `pascal-case-types` — requires class, interface, type alias, and enum
 * declaration names to be PascalCase.
 *
 * A type's name is the only part of it most readers ever see. PascalCase is the
 * one signal that a bare identifier denotes a type rather than a value, so a
 * name that breaks the convention makes every use site ambiguous.
 *
 * A type private to this file is renamed, with its uses, by a fix. One other
 * files may see, being exported or global, gets the rename as a suggestion.
 */
export const pascalCaseTypesRule: ExplicitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Enforce PascalCase names for classes, interfaces, type aliases, and enums",
      url: docsUrl("pascal-case-types"),
    },
    fixable: "code",
    hasSuggestions: true,
    schema: [],
    messages: {
      notPascalCase: "{{kind}} name '{{name}}' is not in PascalCase.",
      rename: "Rename `{{name}}` to `{{suggestion}}` throughout this file.",
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
      const suggestion = toPascalCase(identifier.name);
      const rename = PASCAL_CASE_PATTERN.test(suggestion)
        ? renameFix(context.sourceCode, identifier, suggestion)
        : null;
      context.report({
        node: identifier,
        messageId: "notPascalCase",
        data: { kind, name: identifier.name },
        ...(rename?.private === true ? { fix: rename.fix } : {}),
        suggest:
          rename === null || rename.private
            ? []
            : [
                {
                  messageId: "rename",
                  data: { name: identifier.name, suggestion },
                  fix: rename.fix,
                },
              ],
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
