import type { RuleFixer, RuleTextEdit } from "@eslint/core";
import type { TSESTree } from "@typescript-eslint/types";

import {
  docsUrl,
  type ExplicitRule,
  type ExplicitSourceCode,
  isFilePrivate,
  literalString,
  type ScopeVariable,
} from "#helpers";

/** `OPEN`, `IN_PROGRESS` - the casing a string union member must have. */
const UPPER_SNAKE_CASE_PATTERN = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/u;

/** A name `pascal-case-types` accepts for a type. */
const PASCAL_CASE_PATTERN = /^[A-Z][A-Za-z0-9]*$/u;

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

/** The variable an enum declares, unless it merges with another declaration. */
function enumVariable(
  source: ExplicitSourceCode,
  node: TSESTree.TSEnumDeclaration,
): ScopeVariable | null {
  const variable = source
    .getDeclaredVariables(node)
    .find((each) =>
      each.identifiers.some((identifier) => identifier.range[0] === node.id.range[0]),
    );
  return variable === undefined || variable.identifiers.length !== 1 ? null : variable;
}

/**
 * Whether every use of the enum in this file is as a bare type, `Status`, which
 * the union also satisfies. A member access, `Status.Open`, has no union
 * equivalent.
 */
function usedOnlyAsType(variable: ScopeVariable): boolean {
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
 * `no-enum` - rejects every `enum` declaration, including `const enum` and string enums.
 *
 * An `enum` is the one TypeScript type that emits a runtime value, and its
 * members are opaque at the boundary: a numeric enum serializes as a number
 * nobody can read, and the declaration must be imported everywhere the value is
 * named. A string union is the same closed set with none of that.
 *
 * A string enum this file uses only as a type becomes the union of its values:
 * by a fix when the enum is private to this file, and by a suggestion when it
 * is exported or global, since other files may still name its members.
 */
export const noEnumRule: ExplicitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow `enum` declarations",
      url: docsUrl("no-enum"),
    },
    fixable: "code",
    hasSuggestions: true,
    schema: [],
    messages: {
      enum: "Unexpected enum '{{name}}'.",
      toUnion: "Replace enum `{{name}}` with a union of its string values.",
    },
  },
  create(context) {
    return {
      TSEnumDeclaration(node: TSESTree.TSEnumDeclaration): void {
        const name = node.id.name;
        const source = context.sourceCode;
        const values = upperSnakeValues(node);
        const variable = enumVariable(source, node);
        const replaceable =
          values !== null &&
          variable !== null &&
          !COMMENT_PATTERN.test(source.text.slice(node.range[0], node.range[1])) &&
          usedOnlyAsType(variable);
        if (!replaceable) {
          context.report({ node: node.id, messageId: "enum", data: { name } });
          return;
        }
        const fix: RuleFixer = (fixer): RuleTextEdit =>
          fixer.replaceText(
            node,
            `type ${name} = ${values.map((value) => `"${value}"`).join(" | ")};`,
          );
        if (PASCAL_CASE_PATTERN.test(name) && isFilePrivate(source, [variable])) {
          context.report({ node: node.id, messageId: "enum", data: { name }, fix });
          return;
        }
        context.report({
          node: node.id,
          messageId: "enum",
          data: { name },
          suggest: [{ messageId: "toUnion", data: { name }, fix }],
        });
      },
    };
  },
};
