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
 * Whether TypeScript infers `void` for this function when it returns no value.
 * Declarations and class methods do even when their end is unreachable;
 * function expressions and arrows infer `never` then, and accessors are left
 * out, so a `void` annotation there could change the type.
 */
function infersVoid(node: FunctionNode): boolean {
  if (node.type === "FunctionDeclaration") {
    return true;
  }
  const parent = node.parent;
  return parent.type === "MethodDefinition" && parent.kind === "method";
}

/** A function being walked, and whether a `return` in it hands back a value. */
interface FunctionFrame {
  node: FunctionNode;
  missing: boolean;
  returnsValue: boolean;
}

/**
 * `require-return-type` — requires a named function to declare its return type.
 *
 * Without one, the only way to learn what a function gives back is to read its
 * body to the end, including every branch. Callbacks are exempt: their type
 * comes from the parameter they are passed to, so writing it again adds noise
 * rather than information.
 */
export const requireReturnTypeRule: ExplicitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Require explicit return types on named functions",
      url: docsUrl("require-return-type"),
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      function: "Missing return type on function.",
      methodSignature: "Missing return type on method signature.",
      addVoid: "Declare the return type `void`.",
      addPromiseVoid: "Declare the return type `Promise<void>`.",
    },
  },
  create(context) {
    const frames: FunctionFrame[] = [];
    const code = context.sourceCode;
    const source = "text" in code ? code.text : "";

    function enter(node: FunctionNode, always: boolean): void {
      const missing = (always || isNamed(node)) && !node.returnType;
      frames.push({ node, missing, returnsValue: false });
    }

    /**
     * Where `: void` would go — just after the parameter list's `)` — if the
     * function returns no value and TypeScript would infer `void` for it.
     */
    function voidAnnotationOffset(frame: FunctionFrame): number | null {
      const { node } = frame;
      const body = node.body;
      if (
        frame.returnsValue ||
        node.generator ||
        body?.type !== "BlockStatement" ||
        !infersVoid(node)
      ) {
        return null;
      }
      const offset = source.slice(0, body.range[0]).trimEnd().length;
      return source[offset - 1] === ")" ? offset : null;
    }

    /**
     * Report the function being left if it lacks a return type. When it would
     * infer `void`, suggest writing that out: a suggestion rather than a fix,
     * since the author may mean a wider type the body does not yet return.
     */
    function leave(): void {
      const frame = frames.pop();
      if (frame === undefined || !frame.missing) {
        return;
      }
      const { node } = frame;
      const offset = voidAnnotationOffset(frame);
      const annotation = node.async ? ": Promise<void>" : ": void";
      context.report({
        node: node.id ?? node,
        messageId: "function",
        suggest:
          offset === null
            ? []
            : [
                {
                  messageId: node.async ? "addPromiseVoid" : "addVoid",
                  fix: (fixer) => fixer.insertTextAfterRange([offset, offset], annotation),
                },
              ],
      });
    }

    return {
      FunctionDeclaration(node: TSESTree.FunctionDeclaration): void {
        enter(node, true);
      },
      "FunctionDeclaration:exit"(): void {
        leave();
      },
      TSDeclareFunction(node: TSESTree.TSDeclareFunction): void {
        enter(node, true);
      },
      "TSDeclareFunction:exit"(): void {
        leave();
      },
      FunctionExpression(node: TSESTree.FunctionExpression): void {
        enter(node, false);
      },
      "FunctionExpression:exit"(): void {
        leave();
      },
      TSEmptyBodyFunctionExpression(node: TSESTree.TSEmptyBodyFunctionExpression): void {
        enter(node, false);
      },
      "TSEmptyBodyFunctionExpression:exit"(): void {
        leave();
      },
      ArrowFunctionExpression(node: TSESTree.ArrowFunctionExpression): void {
        enter(node, false);
      },
      "ArrowFunctionExpression:exit"(): void {
        leave();
      },
      ReturnStatement(node: TSESTree.ReturnStatement): void {
        const frame = frames.at(-1);
        if (frame !== undefined && node.argument !== null) {
          frame.returnsValue = true;
        }
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
