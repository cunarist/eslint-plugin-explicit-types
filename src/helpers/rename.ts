/**
 * Renaming a declared name together with every use of it in the file, for the
 * naming rules' fixes and suggestions.
 */

import type { RuleFixer, RuleTextEdit } from "@eslint/core";
import type { TSESTree } from "@typescript-eslint/types";

import { declarationOf, isFilePrivate, sameRange } from "./privacy.ts";
import type { ExplicitSourceCode, ScopeVariable } from "./rule.ts";

/** Declarations that name a type, which `pascal-case-types` wants PascalCase. */
const TYPE_DECLARATION_TYPES: ReadonlySet<string> = new Set([
  "ClassDeclaration",
  "TSEnumDeclaration",
  "TSInterfaceDeclaration",
  "TSModuleDeclaration",
  "TSTypeAliasDeclaration",
]);

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

/** A rename's edits, and whether they are safe to apply as a fix. */
export interface Rename {
  fix: RuleFixer;
  /** Whether the name is private to this file; see `isFilePrivate`. */
  private: boolean;
  /** Whether one of the declarations renamed is a class, interface, type, enum, or namespace. */
  namesType: boolean;
}

/**
 * A rename of the name `identifier` declares to `name`, at its
 * declarations and every reference in this file. A shorthand property keeps
 * its key and `export { name }` keeps its exported name, so neither the
 * object's shape nor what other files import changes.
 *
 * Returns `null` when the declaration is not a scoped variable, or when
 * `name` already appears in the text of `within`, the whole file unless a
 * narrower node is given, and the rename could capture or shadow it.
 */
export function renameFix(
  source: ExplicitSourceCode,
  identifier: TSESTree.Identifier,
  name: string,
  within?: TSESTree.Node,
): Rename | null {
  const variables = variablesOf(source, identifier);
  const text = within === undefined ? source.text : source.text.slice(...within.range);
  if (variables.length === 0 || appearsIn(text, name)) {
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
  // Empty edits at both ends stretch the fix over the whole file, so no
  // other fix lands in the same pass. Two renames to one name in nested
  // scopes could otherwise capture each other's uses; applied one per pass,
  // each sees the last and backs off when its name is already taken.
  const end = source.text.length;
  return {
    fix: (fixer): RuleTextEdit[] => [
      fixer.insertTextBeforeRange([0, 0], ""),
      ...[...targets.values()].map((target) =>
        fixer.replaceTextRange(
          [target.range[0], target.range[0] + length],
          replacement(target, identifier.name, name),
        ),
      ),
      fixer.insertTextAfterRange([end, end], ""),
    ],
    private: isFilePrivate(source, variables),
    namesType: variables.some((variable) =>
      variable.identifiers.some((each) => {
        const declaration = declarationOf(each);
        return declaration !== null && TYPE_DECLARATION_TYPES.has(declaration.type);
      }),
    ),
  };
}
