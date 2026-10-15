import type { TSESTree } from "@typescript-eslint/types";

import { docsUrl, type ExplicitRule, keyText } from "#helpers";

/** `OPEN`, `IN_PROGRESS`, `HTTP2_PUSH` — the casing a string union member has. */
const UPPER_SNAKE_CASE_PATTERN = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/u;

/**
 * `no-upper-snake-object-keys` — rejects UPPER_SNAKE_CASE object keys and type
 * members.
 *
 * That casing is what a string union member looks like, so an object wearing it
 * is a lookup table keyed by the union — and a lookup table stays silent when
 * the union gains a member. A `switch` does not.
 */
export const noUpperSnakeObjectKeysRule: ExplicitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow UPPER_SNAKE_CASE object keys and type members",
      url: docsUrl("no-upper-snake-object-keys"),
    },
    schema: [],
    messages: {
      upperSnakeKey:
        "Object key `{{text}}` is UPPER_SNAKE_CASE. That is a string union member, so this object is a lookup keyed by the union. Write a function that switches on it instead, and a new member becomes a compile error.",
    },
  },
  create(context) {
    function check(key: TSESTree.Node, computed: boolean): void {
      // A computed key cannot be judged from syntax alone.
      if (computed) {
        return;
      }
      const text = keyText(key);
      if (text === null || !UPPER_SNAKE_CASE_PATTERN.test(text)) {
        return;
      }
      context.report({ node: key, messageId: "upperSnakeKey", data: { text } });
    }

    return {
      Property(node: TSESTree.Property): void {
        // `Property` also covers destructuring patterns, which bind names
        // rather than declare keys.
        if (node.parent.type !== "ObjectExpression") {
          return;
        }
        check(node.key, node.computed);
      },
      TSPropertySignature(node: TSESTree.TSPropertySignature): void {
        check(node.key, node.computed);
      },
    };
  },
};
