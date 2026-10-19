import type { RuleTextEdit, RuleTextEditor, SuggestedEdit } from "@eslint/core";
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

/** The offset of the first non-space character at or after `index`. */
function skipSpaceForward(text: string, index: number): number {
  let cursor = index;
  while (cursor < text.length && /\s/u.test(text.charAt(cursor))) {
    cursor += 1;
  }
  return cursor;
}

/** The offset just past the last non-space character before `index`. */
function skipSpaceBackward(text: string, index: number): number {
  let cursor = index;
  while (cursor > 0 && /\s/u.test(text.charAt(cursor - 1))) {
    cursor -= 1;
  }
  return cursor;
}

/**
 * The range that removes `null` and the `|` joining it to its union, or `null`
 * when anything but whitespace sits in between, such as a comment or a
 * parenthesis, which a suggestion should not touch.
 */
function nullMemberRange(text: string, node: TSESTree.TSNullKeyword): [number, number] | null {
  const union = node.parent;
  if (union.type !== "TSUnionType") {
    return null;
  }
  const [start, end] = node.range;
  if (union.types[0] === node) {
    const bar = skipSpaceForward(text, end);
    return text.charAt(bar) === "|" ? [start, skipSpaceForward(text, bar + 1)] : null;
  }
  const bar = skipSpaceBackward(text, start) - 1;
  return text.charAt(bar) === "|" ? [skipSpaceBackward(text, bar), end] : null;
}

/**
 * The offset of the `?` marking the binding an annotation belongs to, or
 * `null` when dropping it would leave code that fails to type-check: a class
 * field with no initializer must then be assigned in the constructor.
 */
function questionOffset(text: string, annotation: TSESTree.TSTypeAnnotation): number | null {
  const owner = annotation.parent;
  if (owner.type === "PropertyDefinition" && owner.value === null && !owner.declare) {
    return null;
  }
  const colon = skipSpaceBackward(text, annotation.typeAnnotation.range[0]) - 1;
  if (text.charAt(colon) !== ":") {
    return null;
  }
  const question = skipSpaceBackward(text, colon) - 1;
  return text.charAt(question) === "?" ? question : null;
}

/**
 * Both ways to settle on one spelling, where an edit can make them. `text` is
 * `null` when the host gives no source text, and then there are none.
 */
function suggestions(
  text: string | null,
  node: TSESTree.TSNullKeyword,
  annotation: TSESTree.TSTypeAnnotation,
): SuggestedEdit[] {
  if (text === null) {
    return [];
  }
  const suggest: SuggestedEdit[] = [];
  const removal = nullMemberRange(text, node);
  if (removal !== null) {
    suggest.push({
      messageId: "dropNull",
      fix: (fixer: RuleTextEditor): RuleTextEdit => fixer.removeRange(removal),
    });
  }
  const question = questionOffset(text, annotation);
  if (question !== null) {
    suggest.push({
      messageId: "dropOptional",
      fix: (fixer: RuleTextEditor): RuleTextEdit => fixer.removeRange([question, question + 1]),
    });
  }
  return suggest;
}

/**
 * `no-optional-null` - rejects a binding that is both marked `?` and unioned
 * with `null`.
 *
 * `?` already means the value can be absent, so adding `| null` gives two ways
 * to say the same thing and leaves the reader two cases to handle for one
 * condition.
 */
export const noOptionalNullRule: ExplicitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow combining an optional `?` with `| null`",
      url: docsUrl("no-optional-null"),
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      dropNull: "Drop the `| null`, so absence is spelled `?`.",
      dropOptional: "Drop the `?`, so absence is spelled `null`.",
      named: "Optional '{{name}}' also admits `null`.",
      unnamed: "Optional binding also admits `null`.",
    },
  },
  create(context) {
    const source = context.sourceCode;
    const text = "text" in source ? source.text : null;
    return {
      TSNullKeyword(node: TSESTree.TSNullKeyword): void {
        const parent = node.parent;
        // Step past a union so `T | null` reads as the annotation itself.
        const annotation = parent.type === "TSUnionType" ? parent.parent : parent;
        if (annotation.type !== "TSTypeAnnotation") {
          return;
        }
        const binding = optionalBinding(annotation);
        if (binding === null) {
          return;
        }
        const name = binding.type === "Identifier" ? binding.name : keyText(binding);
        const suggest = suggestions(text, node, annotation);
        if (name === null) {
          context.report({ node, messageId: "unnamed", suggest });
          return;
        }
        context.report({ node, messageId: "named", data: { name }, suggest });
      },
    };
  },
};
