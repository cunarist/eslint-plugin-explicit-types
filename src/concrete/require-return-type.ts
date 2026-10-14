import type { TSESTree } from "@typescript-eslint/types";

import { docsUrl, type ExplicitRule } from "#helpers";

/** Method kinds TypeScript forbids a return type on. */
const UNANNOTATABLE_METHOD_KINDS: readonly string[] = ["constructor", "set"];

/** A function-like node that may carry a `returnType`. */
type FunctionNode = TSESTree.FunctionLike;

/**
 * Whether this function is named rather than passed inline. A callback's type
 * is fixed by the signature it is handed to; only bound and declared functions
 * state a contract of their own.
 */
function isNamed(node: FunctionNode): boolean {
  const parent = node.parent;
  if (parent.type === "VariableDeclarator") {
    return true;
  }
  if (parent.type === "MethodDefinition" || parent.type === "TSAbstractMethodDefinition") {
    return !UNANNOTATABLE_METHOD_KINDS.includes(parent.kind);
  }
  return false;
}

/**
 * `require-return-type` — requires a named function to declare its return type.
 *
 * Without one, the only way to learn what a function gives back is to read its
 * body to the end, including every branch. Callbacks are exempt: their type
 * comes from the parameter they are passed to, so writing it again adds noise
 * rather than information.
 */
export const requireReturnType: ExplicitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Require explicit return types on named functions",
      url: docsUrl("require-return-type"),
    },
    schema: [],
    messages: {
      function:
        "Function has no return type. Write the return type out, so the contract is readable without reading the body.",
      methodSignature:
        "Method signature has no return type. Write the return type out, so the contract is readable without reading the body.",
    },
  },
  create(context) {
    function check(node: FunctionNode, always: boolean): void {
      if (!always && !isNamed(node)) {
        return;
      }
      if (node.returnType) {
        return;
      }
      context.report({ node: node.id ?? node, messageId: "function" });
    }

    return {
      FunctionDeclaration(node: TSESTree.FunctionDeclaration): void {
        check(node, true);
      },
      TSDeclareFunction(node: TSESTree.TSDeclareFunction): void {
        check(node, true);
      },
      FunctionExpression(node: TSESTree.FunctionExpression): void {
        check(node, false);
      },
      TSEmptyBodyFunctionExpression(node: TSESTree.TSEmptyBodyFunctionExpression): void {
        check(node, false);
      },
      ArrowFunctionExpression(node: TSESTree.ArrowFunctionExpression): void {
        check(node, false);
      },
      TSMethodSignature(node: TSESTree.TSMethodSignature): void {
        if (node.returnType) {
          return;
        }
        context.report({ node: node.key, messageId: "methodSignature" });
      },
    };
  },
};
