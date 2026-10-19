/**
 * Generic AST helpers.
 *
 * Both ESLint (through `@typescript-eslint/parser`) and Oxlint hand rules a
 * TypeScript-ESTree tree, typed here by `TSESTree`. Access fields by name
 * rather than walking `Object.keys(node)` - Oxlint deserializes the tree
 * lazily, so generic traversal is slow and not guaranteed to see every field.
 */

import type { TSESTree } from "@typescript-eslint/types";

/**
 * The `typeName` of a `TSTypeReference`.
 *
 * Derived from the field itself so it cannot drift: an identifier, a
 * qualified name, or `this`, which is a legal type.
 */
export type TypeNameNode = TSESTree.TSTypeReference["typeName"];

/**
 * Dotted name of a type reference's `typeName`, e.g. `React.ReactNode`.
 * Returns `null` for anything that is not a plain qualified name.
 */
export function typeName(node: TypeNameNode): string | null {
  switch (node.type) {
    case "Identifier":
      return node.name;
    case "ThisExpression":
      return "this";
    case "TSQualifiedName": {
      const left = typeName(node.left);
      if (left === null) {
        return null;
      }
      return `${left}.${node.right.name}`;
    }
    default:
      return null;
  }
}

/** The last segment of a qualified type name, e.g. `A.B.Partial` -> `Partial`. */
export function typeNameTail(node: TypeNameNode): string | null {
  const name = typeName(node);
  if (name === null) {
    return null;
  }
  const segments = name.split(".");
  return segments.at(-1) ?? null;
}

/**
 * The written form of an object or type member key, or `null` when it cannot
 * be read from syntax alone - a computed key such as `[token]`.
 */
export function keyText(key: TSESTree.Node): string | null {
  if (key.type === "Identifier") {
    return key.name;
  }
  return literalString(key);
}

/** The string value of a literal node, or `null` if it is not a string. */
export function literalString(node: TSESTree.Node): string | null {
  if (node.type !== "Literal") {
    return null;
  }
  return typeof node.value === "string" ? node.value : null;
}
