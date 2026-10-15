import type { TSESTree } from "@typescript-eslint/types";

import { docsUrl, type ExplicitRule, typeNameTail } from "#helpers";

/** The 22 built-in TypeScript utility types this rule rejects. */
const UTILITY_TYPE_NAMES: readonly string[] = [
  "Awaited",
  "Partial",
  "Required",
  "Readonly",
  "Record",
  "Pick",
  "Omit",
  "Exclude",
  "Extract",
  "NonNullable",
  "Parameters",
  "ConstructorParameters",
  "ReturnType",
  "InstanceType",
  "ThisParameterType",
  "OmitThisParameter",
  "ThisType",
  "NoInfer",
  "Uppercase",
  "Lowercase",
  "Capitalize",
  "Uncapitalize",
];

/**
 * `no-utility-types` — rejects the 22 built-in TypeScript utility types.
 *
 * A built-in utility type names a transformation, not a shape. The reader has
 * to apply `Partial`/`Omit`/`ReturnType` in their head against a definition
 * that lives somewhere else to know what the value actually is.
 */
export const noUtilityTypesRule: ExplicitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow the built-in TypeScript utility types",
      url: docsUrl("no-utility-types"),
    },
    schema: [],
    messages: {
      utilityType:
        "Utility type `{{name}}`. Write the resulting type out, so the shape is readable without applying the transformation.",
    },
  },
  create(context) {
    return {
      TSTypeReference(node: TSESTree.TSTypeReference): void {
        const name = typeNameTail(node.typeName);
        if (name === null || !UTILITY_TYPE_NAMES.includes(name)) {
          return;
        }
        context.report({ node, messageId: "utilityType", data: { name } });
      },
    };
  },
};
