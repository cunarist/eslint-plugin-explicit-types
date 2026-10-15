import type { TSESTree } from "@typescript-eslint/types";

import { docsUrl, type ExplicitRule } from "#helpers";

/**
 * `no-conditional-types` — rejects conditional types and the `infer` keyword.
 *
 * A conditional type is a branch the reader has to evaluate before they know
 * what a value is, and `infer` names a type nobody wrote. Both move the answer
 * out of the declaration and into the compiler.
 */
export const noConditionalTypesRule: ExplicitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow conditional types and the `infer` keyword",
      url: docsUrl("no-conditional-types"),
    },
    schema: [],
    messages: {
      conditional:
        "Conditional type. Write each resulting type out and name it, so the reader does not have to evaluate the branch.",
      infer:
        "`infer` in a type position. Name the type you are extracting and write it out, rather than having the compiler recover it.",
    },
  },
  create(context) {
    return {
      TSConditionalType(node: TSESTree.TSConditionalType): void {
        context.report({ node, messageId: "conditional" });
      },
      TSInferType(node: TSESTree.TSInferType): void {
        context.report({ node, messageId: "infer" });
      },
    };
  },
};
