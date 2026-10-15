import type { RuleTextEdit } from "@eslint/core";
import type { TSESTree } from "@typescript-eslint/types";

import { docsUrl, type ExplicitRule, literalString } from "#helpers";

/** `ONE`, `ONE_TWO`, `HTTP2_PUSH` — uppercase segments joined by underscores. */
const UPPER_SNAKE_CASE_PATTERN = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/u;

/** A lowercase letter or digit followed by an uppercase one: a camelCase word break. */
const CAMEL_BREAK_PATTERN = /([a-z0-9])([A-Z])/gu;

/** An acronym followed by a capitalized word, as in `HTTPServer`. */
const ACRONYM_BREAK_PATTERN = /([A-Z])([A-Z][a-z])/gu;

/** Runs of anything but ASCII letters and digits. */
const SEPARATOR_PATTERN = /[^A-Za-z0-9]+/u;

/** `in progress`, `inProgress`, `in-progress` -> `IN_PROGRESS`. */
function toUpperSnakeCase(value: string): string {
  return value
    .replaceAll(CAMEL_BREAK_PATTERN, "$1_$2")
    .replaceAll(ACRONYM_BREAK_PATTERN, "$1_$2")
    .split(SEPARATOR_PATTERN)
    .filter((word) => word !== "")
    .join("_")
    .toUpperCase();
}

/**
 * `upper-snake-string-unions` — requires every string literal member of a union
 * type to be UPPER_SNAKE_CASE.
 *
 * A string union is an enumeration written in the type system. Casing it like a
 * constant rather than like prose is what keeps the member set readable as a
 * closed list of tokens instead of a set of display strings.
 *
 * Every union is checked, not only the ones behind a type alias — a union
 * written inline on an interface member is the same enumeration.
 */
export const upperSnakeStringUnionsRule: ExplicitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Enforce UPPER_SNAKE_CASE for string literal union members",
      url: docsUrl("upper-snake-string-unions"),
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      notUpperSnake:
        'String union member "{{value}}" is not UPPER_SNAKE_CASE. Rewrite the member as an uppercase token, e.g. "IN_PROGRESS".',
      rewrite: 'Rewrite "{{value}}" as "{{suggestion}}".',
    },
  },
  create(context) {
    return {
      TSUnionType(node: TSESTree.TSUnionType): void {
        const members = new Set<string>();
        for (const member of node.types) {
          if (member.type === "TSLiteralType") {
            const value = literalString(member.literal);
            if (value !== null) {
              members.add(value);
            }
          }
        }
        for (const member of node.types) {
          if (member.type !== "TSLiteralType") {
            continue;
          }
          const value = literalString(member.literal);
          if (value === null) {
            continue;
          }
          if (UPPER_SNAKE_CASE_PATTERN.test(value)) {
            continue;
          }
          const suggestion = toUpperSnakeCase(value);
          const literal = member.literal;
          // Another member already spelled this way would make the rewrite a
          // duplicate, and a spelling the pattern rejects is no fix at all.
          const rewritable = UPPER_SNAKE_CASE_PATTERN.test(suggestion) && !members.has(suggestion);
          const quote = context.sourceCode.text.charAt(literal.range[0]);
          context.report({
            node: member,
            messageId: "notUpperSnake",
            data: { value },
            suggest: rewritable
              ? [
                  {
                    messageId: "rewrite",
                    data: { value, suggestion },
                    fix: (fixer): RuleTextEdit =>
                      fixer.replaceText(literal, quote + suggestion + quote),
                  },
                ]
              : [],
          });
        }
      },
    };
  },
};
