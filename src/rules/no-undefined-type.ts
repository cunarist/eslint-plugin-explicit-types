import type { RuleTextEdit, RuleTextEditor } from "@eslint/core";
import type { TSESTree } from "@typescript-eslint/types";

import { docsUrl, type ExplicitRule } from "#helpers";

/** Where a `T | undefined` annotation sits, and so how `?` can replace it. */
type Placement =
  /** On a binding already marked `?`, where `| undefined` repeats it. */
  | "REDUNDANT"
  /** On a binding that could take `?` in place of `| undefined`. */
  | "MARKABLE"
  /** Somewhere `?` cannot go. */
  | "FIXED";

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
 * The range that removes `member` and the `|` joining it to its union, or
 * `null` when anything but whitespace sits in between, such as a comment or a
 * parenthesis, which a fix should not touch.
 */
function unionMemberRange(
  text: string,
  union: TSESTree.TSUnionType,
  member: TSESTree.Node,
): [number, number] | null {
  const [start, end] = member.range;
  if (union.types[0] === member) {
    const bar = skipSpaceForward(text, end);
    if (text.charAt(bar) !== "|") {
      return null;
    }
    return [start, skipSpaceForward(text, bar + 1)];
  }
  const bar = skipSpaceBackward(text, start) - 1;
  if (text.charAt(bar) !== "|") {
    return null;
  }
  return [skipSpaceBackward(text, bar), end];
}

/** The offset of the `:` opening a type annotation, or `null` if not found. */
function colonOffset(text: string, annotation: TSESTree.TSTypeAnnotation): number | null {
  const colon = skipSpaceBackward(text, annotation.typeAnnotation.range[0]) - 1;
  return text.charAt(colon) === ":" ? colon : null;
}

/** Whether a parameter may be omitted by a caller. */
function isOmittable(param: TSESTree.Parameter): boolean {
  switch (param.type) {
    case "Identifier":
      return param.optional;
    case "AssignmentPattern":
    case "RestElement":
      return true;
    case "TSParameterProperty":
      return isOmittable(param.parameter);
    default:
      return false;
  }
}

/** The parameter list of a function-like node, or `null` for anything else. */
function parametersOf(node: TSESTree.Node): TSESTree.Parameter[] | null {
  switch (node.type) {
    case "ArrowFunctionExpression":
    case "FunctionDeclaration":
    case "FunctionExpression":
    case "TSCallSignatureDeclaration":
    case "TSConstructSignatureDeclaration":
    case "TSConstructorType":
    case "TSDeclareFunction":
    case "TSEmptyBodyFunctionExpression":
    case "TSFunctionType":
    case "TSMethodSignature":
      return node.params;
    default:
      return null;
  }
}

/** Whether every parameter after `param` may be omitted, so `param` can be too. */
function onlyOmittableAfter(owner: TSESTree.Node, param: TSESTree.Parameter): boolean {
  const params = parametersOf(owner);
  const index = params === null ? -1 : params.indexOf(param);
  return (
    params !== null && index !== -1 && params.slice(index + 1).every((later) => isOmittable(later))
  );
}

/** How `?` relates to a parameter annotated `T | undefined`. */
function parameterPlacement(binding: TSESTree.Identifier): Placement {
  if (binding.name === "this") {
    return "FIXED";
  }
  if (binding.optional) {
    return "REDUNDANT";
  }
  const owner = binding.parent;
  if (owner.type === "TSParameterProperty") {
    return onlyOmittableAfter(owner.parent, owner) ? "MARKABLE" : "FIXED";
  }
  return onlyOmittableAfter(owner, binding) ? "MARKABLE" : "FIXED";
}

/** How `?` relates to the binding a `T | undefined` annotation belongs to. */
function placementOf(annotation: TSESTree.TSTypeAnnotation): Placement {
  const owner = annotation.parent;
  switch (owner.type) {
    case "Identifier":
      return parameterPlacement(owner);
    case "TSPropertySignature":
    case "TSAbstractPropertyDefinition":
      return owner.optional ? "REDUNDANT" : "MARKABLE";
    case "PropertyDefinition":
      if (owner.optional) {
        return "REDUNDANT";
      }
      return owner.definite ? "FIXED" : "MARKABLE";
    default:
      return "FIXED";
  }
}

/**
 * `no-undefined-type` — rejects the `undefined` keyword in any type position.
 *
 * `undefined` is what the language returns when nobody said anything; `null` is
 * what someone wrote. A member or parameter says absence with `?`, everything
 * else says it with `null`, and the keyword never appears in a signature.
 */
export const noUndefinedTypeRule: ExplicitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow the `undefined` keyword in type positions",
      url: docsUrl("no-undefined-type"),
    },
    fixable: "code",
    hasSuggestions: true,
    schema: [],
    messages: {
      undefinedType: "Unexpected `undefined` in a type position.",
      dropUndefined: "Drop the `| undefined` that `?` already implies.",
      markOptional: "Mark the binding `?` in place of `| undefined`.",
    },
  },
  create(context) {
    const source = context.sourceCode;
    const text = "text" in source ? source.text : null;
    return {
      TSUndefinedKeyword(node: TSESTree.TSUndefinedKeyword): void {
        const union = node.parent;
        if (text === null || union.type !== "TSUnionType") {
          context.report({ node, messageId: "undefinedType" });
          return;
        }
        const annotation = union.parent;
        if (
          annotation.type !== "TSTypeAnnotation" ||
          // A second `undefined` or a `null` would survive the edit and be reported again.
          union.types.some(
            (member) =>
              member !== node &&
              (member.type === "TSUndefinedKeyword" || member.type === "TSNullKeyword"),
          )
        ) {
          context.report({ node, messageId: "undefinedType" });
          return;
        }
        const removal = unionMemberRange(text, union, node);
        const placement = placementOf(annotation);
        if (removal === null || placement === "FIXED") {
          context.report({ node, messageId: "undefinedType" });
          return;
        }
        const drop = (fixer: RuleTextEditor): RuleTextEdit => fixer.removeRange(removal);
        if (placement === "REDUNDANT") {
          // On a parameter `a?: T` and `a?: T | undefined` are one type. On a
          // property, parameter properties included, they differ under
          // `exactOptionalPropertyTypes`.
          const binding = annotation.parent;
          if (binding.type === "Identifier" && binding.parent.type !== "TSParameterProperty") {
            context.report({ node, messageId: "undefinedType", fix: drop });
            return;
          }
          context.report({
            node,
            messageId: "undefinedType",
            suggest: [{ messageId: "dropUndefined", fix: drop }],
          });
          return;
        }
        const colon = colonOffset(text, annotation);
        if (colon === null) {
          context.report({ node, messageId: "undefinedType" });
          return;
        }
        context.report({
          node,
          messageId: "undefinedType",
          suggest: [
            {
              messageId: "markOptional",
              fix: (fixer: RuleTextEditor): RuleTextEdit[] => [
                fixer.insertTextBeforeRange([colon, colon], "?"),
                fixer.removeRange(removal),
              ],
            },
          ],
        });
      },
    };
  },
};
