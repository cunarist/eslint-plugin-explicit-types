import type { RuleTextEdit, RuleTextEditor } from "@eslint/core";
import type { TSESTree } from "@typescript-eslint/types";

import { docsUrl, type ExplicitRule, typeNameTail } from "#helpers";

/** The 22 built-in TypeScript utility types this rule rejects. */
const UTILITY_TYPE_NAMES: ReadonlySet<string> = new Set([
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
]);

/** The intrinsic string types, each with the change it makes to a literal. */
const STRING_INTRINSICS: ReadonlyMap<string, (value: string) => string> = new Map([
  ["Uppercase", (value: string): string => value.toUpperCase()],
  ["Lowercase", (value: string): string => value.toLowerCase()],
  ["Capitalize", (value: string): string => value.charAt(0).toUpperCase() + value.slice(1)],
  ["Uncapitalize", (value: string): string => value.charAt(0).toLowerCase() + value.slice(1)],
]);

/** Parents that bind tighter than `readonly`, so the operator needs parentheses. */
const TIGHTER_THAN_READONLY: ReadonlySet<string> = new Set([
  "TSArrayType",
  "TSIndexedAccessType",
  "TSTypeOperator",
]);

/**
 * The written-out equivalent of a utility type reference, when syntax alone
 * determines it exactly: `Readonly<T[]>` is `readonly T[]`, and a string
 * intrinsic applied to a string literal is the transformed literal. `null`
 * for everything else.
 */
function writtenOut(node: TSESTree.TSTypeReference, text: string): string | null {
  const argument = node.typeArguments?.params.length === 1 ? node.typeArguments.params[0] : null;
  if (node.typeName.type !== "Identifier" || argument === undefined || argument === null) {
    return null;
  }
  const argumentText = text.slice(argument.range[0], argument.range[1]);
  // A comment around the argument would be lost with the brackets.
  const around =
    text.slice(node.range[0], argument.range[0]) + text.slice(argument.range[1], node.range[1]);
  if (around.includes("/")) {
    return null;
  }
  const name = node.typeName.name;
  if (name === "Readonly") {
    if (argument.type !== "TSArrayType" && argument.type !== "TSTupleType") {
      return null;
    }
    const operator = `readonly ${argumentText}`;
    return TIGHTER_THAN_READONLY.has(node.parent.type) ? `(${operator})` : operator;
  }
  const transform = STRING_INTRINSICS.get(name);
  if (transform === undefined || argument.type !== "TSLiteralType") {
    return null;
  }
  // A transformed member of a union could break `upper-snake-string-unions`.
  if (node.parent.type === "TSUnionType" || argument.literal.type !== "Literal") {
    return null;
  }
  const value = argument.literal.value;
  return typeof value === "string" ? JSON.stringify(transform(value)) : null;
}

/**
 * `no-utility-types` - rejects the 22 built-in TypeScript utility types.
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
    fixable: "code",
    schema: [],
    messages: {
      utilityType: "Unexpected utility type '{{name}}'.",
    },
  },
  create(context) {
    return {
      TSTypeReference(node: TSESTree.TSTypeReference): void {
        const name = typeNameTail(node.typeName);
        if (name === null || !UTILITY_TYPE_NAMES.has(name)) {
          return;
        }
        const source = context.sourceCode;
        const replacement = "text" in source ? writtenOut(node, source.text) : null;
        context.report({
          node,
          messageId: "utilityType",
          data: { name },
          fix:
            replacement === null
              ? null
              : (fixer: RuleTextEditor): RuleTextEdit => fixer.replaceText(node, replacement),
        });
      },
    };
  },
};
