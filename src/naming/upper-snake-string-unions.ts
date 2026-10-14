import type { TSESTree } from "@typescript-eslint/types";

import { docsUrl, type ExplicitRule, literalString } from "#helpers";

/** `ONE`, `ONE_TWO`, `HTTP2_PUSH` — uppercase segments joined by underscores. */
const UPPER_SNAKE_CASE_PATTERN = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/;

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
export const upperSnakeStringUnions: ExplicitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Requires every string literal member of a union type to be UPPER_SNAKE_CASE.",
      url: docsUrl("naming", "upper-snake-string-unions"),
    },
    schema: [],
    messages: {
      notUpperSnake:
        'String union member "{{value}}" is not UPPER_SNAKE_CASE. Rewrite the member as an uppercase token, e.g. "IN_PROGRESS".',
    },
  },
  create(context) {
    return {
      TSUnionType(node: TSESTree.TSUnionType): void {
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
          context.report({
            node: member,
            messageId: "notUpperSnake",
            data: { value },
          });
        }
      },
    };
  },
};
