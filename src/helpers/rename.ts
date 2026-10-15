/**
 * Renaming a declared name together with every use of it in the file, for the
 * naming rules' suggestions.
 */

import type { RuleFixer, RuleTextEdit } from "@eslint/core";
import type { TSESTree } from "@typescript-eslint/types";

import type { ExplicitSourceCode, ScopeVariable } from "./rule.ts";

/** Whether two nodes cover the same source text. */
function sameRange(left: TSESTree.Node, right: TSESTree.Node): boolean {
  return left.range[0] === right.range[0] && left.range[1] === right.range[1];
}

/** The variables an identifier declares, found on its nearest declaring ancestor. */
function variablesOf(source: ExplicitSourceCode, identifier: TSESTree.Identifier): ScopeVariable[] {
  let current: TSESTree.Node | null = identifier;
  while (current !== null) {
    const found = source
      .getDeclaredVariables(current)
      .filter((variable) => variable.identifiers.some((each) => sameRange(each, identifier)));
    if (found.length > 0) {
      return found;
    }
    current = current.parent ?? null;
  }
  return [];
}

/** Whether `name` already appears as a word anywhere in the text, comments and strings included. */
function appearsIn(text: string, name: string): boolean {
  const escaped = name.replaceAll("$", String.raw`\$`);
  return new RegExp(String.raw`(?<![\w$])${escaped}(?![\w$])`, "u").test(text);
}

/**
 * Whether an identifier stands for both a key and a value, as in `{ name }`
 * or `{ name = 1 }`, so renaming it must keep the key.
 */
function isShorthand(identifier: TSESTree.Node): boolean {
  const parent = identifier.parent;
  if (parent === undefined) {
    return false;
  }
  if (parent.type === "Property") {
    return parent.shorthand;
  }
  return (
    parent.type === "AssignmentPattern" &&
    sameRange(parent.left, identifier) &&
    parent.parent.type === "Property" &&
    parent.parent.shorthand
  );
}

/** What replaces one occurrence of the old name, keeping keys and export names. */
function replacement(target: TSESTree.Node, oldName: string, name: string): string {
  if (isShorthand(target)) {
    return `${oldName}: ${name}`;
  }
  const parent = target.parent;
  if (parent?.type === "ExportSpecifier" && sameRange(parent.exported, target)) {
    return `${name} as ${oldName}`;
  }
  return name;
}

/**
 * A fix renaming the name `identifier` declares to `name`, at its
 * declarations and every reference in this file. A shorthand property keeps
 * its key and `export { name }` keeps its exported name, so neither the
 * object's shape nor what other files import changes.
 *
 * Returns `null` when the declaration is not a scoped variable, or when
 * `name` already appears in the file and the rename could capture or shadow it.
 */
export function renameFix(
  source: ExplicitSourceCode,
  identifier: TSESTree.Identifier,
  name: string,
): RuleFixer | null {
  const variables = variablesOf(source, identifier);
  if (variables.length === 0 || appearsIn(source.text, name)) {
    return null;
  }
  const targets = new Map<number, TSESTree.Node>();
  for (const variable of variables) {
    for (const declared of variable.identifiers) {
      targets.set(declared.range[0], declared);
    }
    for (const reference of variable.references) {
      targets.set(reference.identifier.range[0], reference.identifier);
    }
  }
  // A declared identifier's range also covers its type annotation, so only
  // the name's own characters are replaced.
  const length = identifier.name.length;
  return (fixer): RuleTextEdit[] =>
    [...targets.values()].map((target) =>
      fixer.replaceTextRange(
        [target.range[0], target.range[0] + length],
        replacement(target, identifier.name, name),
      ),
    );
}
