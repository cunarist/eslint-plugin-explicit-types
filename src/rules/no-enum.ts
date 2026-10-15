import type { RuleTextEdit } from "@eslint/core";
import type { TSESTree } from "@typescript-eslint/types";

import { docsUrl, type ExplicitRule, type ExplicitSourceCode, literalString } from "#helpers";

/** `OPEN`, `IN_PROGRESS` — the casing a string union member must have. */
const UPPER_SNAKE_CASE_PATTERN = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/u;

/** The start of a line or block comment. */
const COMMENT_PATTERN = /\/[/*]/u;

/**
 * The string values of an enum, when every member is initialized with an
 * UPPER_SNAKE_CASE string literal; `null` otherwise. A numeric or computed
 * member, or a lowercase value, has no union spelling that keeps its value
 * and passes `upper-snake-string-unions`.
 */
function upperSnakeValues(node: TSESTree.TSEnumDeclaration): string[] | null {
  const values: string[] = [];
  for (const member of node.body.members) {
    const value = member.initializer ? literalString(member.initializer) : null;
    if (value === null || !UPPER_SNAKE_CASE_PATTERN.test(value) || values.includes(value)) {
      return null;
    }
    values.push(value);
  }
  return values.length === 0 ? null : values;
}

/**
 * Whether every use of the enum in this file is as a bare type, `Status`, which
 * the union also satisfies. A member access, `Status.Open`, has no union
 * equivalent. A merged enum, declared twice, is left alone too.
 */
function usedOnlyAsType(source: ExplicitSourceCode, node: TSESTree.TSEnumDeclaration): boolean {
  const variable = source
    .getDeclaredVariables(node)
    .find((each) =>
      each.identifiers.some((identifier) => identifier.range[0] === node.id.range[0]),
    );
  if (variable === undefined || variable.identifiers.length !== 1) {
    return false;
  }
  return variable.references.every((reference) => {
    const parent = reference.identifier.parent;
    return (
      parent?.type === "TSTypeReference" &&
      parent.typeName.range[0] === reference.identifier.range[0] &&
      !parent.typeArguments
    );
  });
}

/**
 * `no-enum` — rejects every `enum` declaration, including `const enum` and string enums.
 *
 * An `enum` is the one TypeScript type that emits a runtime value, and its
 * members are opaque at the boundary: a numeric enum serializes as a number
 * nobody can read, and the declaration must be imported everywhere the value is
 * named. A string union is the same closed set with none of that.
 *
 * A string enum this file uses only as a type gets a suggestion to become the
 * union of its values. It is not a fix: other files may still name its members.
 */
export const noEnumRule: ExplicitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow `enum` declarations",
      url: docsUrl("no-enum"),
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      enum: 'Enum `{{name}}` declares a runtime value. Use an UPPER_SNAKE_CASE string union type instead, e.g. `type Status = "OPEN" | "CLOSED";`.',
      toUnion: "Replace enum `{{name}}` with a union of its string values.",
    },
  },
  create(context) {
    return {
      TSEnumDeclaration(node: TSESTree.TSEnumDeclaration): void {
        const name = node.id.name;
        const source = context.sourceCode;
        const values = upperSnakeValues(node);
        const replaceable =
          values !== null &&
          !COMMENT_PATTERN.test(source.text.slice(node.range[0], node.range[1])) &&
          usedOnlyAsType(source, node);
        context.report({
          node: node.id,
          messageId: "enum",
          data: { name },
          suggest: replaceable
            ? [
                {
                  messageId: "toUnion",
                  data: { name },
                  fix: (fixer): RuleTextEdit =>
                    fixer.replaceText(
                      node,
                      `type ${name} = ${values.map((value) => `"${value}"`).join(" | ")};`,
                    ),
                },
              ]
            : [],
        });
      },
    };
  },
};
