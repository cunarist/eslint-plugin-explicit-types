/**
 * Renaming a declared name together with every use of it in the file, for the
 * naming rules' fixes and suggestions, and telling whether a name is private
 * to the file, which is what makes a rename safe to apply as a fix.
 */

import type { RuleFixer, RuleTextEdit } from "@eslint/core";
import type { TSESTree } from "@typescript-eslint/types";

import type { ExplicitSourceCode, ScopeReference, ScopeVariable } from "./rule.ts";

/** Patterns a declared name can sit in on the way up to its declaration. */
const PATTERN_TYPES: ReadonlySet<string> = new Set([
  "ArrayPattern",
  "AssignmentPattern",
  "ObjectPattern",
  "Property",
  "RestElement",
  "VariableDeclarator",
  "VariableDeclaration",
]);

/** Declarations whose own name, `id`, a declared identifier can be. */
const NAMED_DECLARATION_TYPES: ReadonlySet<string> = new Set([
  "ClassDeclaration",
  "FunctionDeclaration",
  "TSDeclareFunction",
  "TSEnumDeclaration",
  "TSImportEqualsDeclaration",
  "TSInterfaceDeclaration",
  "TSModuleDeclaration",
  "TSTypeAliasDeclaration",
]);

/** Declarations that name a type, which `pascal-case-types` wants PascalCase. */
const TYPE_DECLARATION_TYPES: ReadonlySet<string> = new Set([
  "ClassDeclaration",
  "TSEnumDeclaration",
  "TSInterfaceDeclaration",
  "TSModuleDeclaration",
  "TSTypeAliasDeclaration",
]);

/** Statements that hand a declaration, or a reference, to other files. */
const EXPORT_TYPES: ReadonlySet<string> = new Set([
  "ExportDefaultDeclaration",
  "ExportNamedDeclaration",
  "ExportSpecifier",
  "TSExportAssignment",
]);

/** Top-level statements that make a file a module rather than a global script. */
const MODULE_STATEMENT_TYPES: ReadonlySet<string> = new Set([
  "ExportAllDeclaration",
  "ExportDefaultDeclaration",
  "ExportNamedDeclaration",
  "ImportDeclaration",
  "TSExportAssignment",
]);

/** Scopes whose names a script file shares with every other script. */
const TOP_LEVEL_SCOPE_TYPES: ReadonlySet<string> = new Set(["global", "module"]);

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
 * The declaration statement a declared identifier belongs to: its variable
 * declaration, or the class, function, or type it names. `null` for a
 * parameter or any other name that no statement declares.
 */
function declarationOf(identifier: TSESTree.Identifier): TSESTree.Node | null {
  let current: TSESTree.Node = identifier;
  let parent: TSESTree.Node | null = current.parent ?? null;
  while (parent !== null && PATTERN_TYPES.has(parent.type)) {
    current = parent;
    parent = current.parent ?? null;
  }
  if (current.type === "VariableDeclaration") {
    return current;
  }
  if (
    parent !== null &&
    NAMED_DECLARATION_TYPES.has(parent.type) &&
    "id" in parent &&
    parent.id !== null &&
    sameRange(parent.id, current)
  ) {
    return parent;
  }
  return null;
}

/**
 * Whether a node sits in an ambient module or namespace, `declare global`,
 * `declare module "x"`, or `declare namespace N`, whose members other files
 * see without an `export`.
 */
function inAmbientModule(node: TSESTree.Node): boolean {
  let current = node.parent ?? null;
  while (current !== null) {
    if (
      current.type === "TSModuleDeclaration" &&
      (current.declare || current.kind !== "namespace")
    ) {
      return true;
    }
    // Oxlint's own node for `declare global`, which `TSESTree` does not list.
    const type: string = current.type;
    if (type === "TSGlobalDeclaration") {
      return true;
    }
    current = current.parent ?? null;
  }
  return false;
}

/** The root of the tree a node belongs to. */
function programOf(node: TSESTree.Node): TSESTree.Node {
  let current = node;
  let parent = current.parent ?? null;
  while (parent !== null) {
    current = parent;
    parent = current.parent ?? null;
  }
  return current;
}

/**
 * Whether the file is a module. TypeScript treats a file with no `import` or
 * `export` as a script, whose top-level names every other script shares.
 */
function isModule(program: TSESTree.Node): boolean {
  if (program.type !== "Program") {
    return false;
  }
  return program.body.some(
    (statement) =>
      MODULE_STATEMENT_TYPES.has(statement.type) ||
      (statement.type === "TSImportEqualsDeclaration" &&
        statement.moduleReference.type === "TSExternalModuleReference"),
  );
}

/** Whether a reference hands its variable to other files, as `export { name }` does. */
function isExportingReference(reference: ScopeReference): boolean {
  const parent = reference.identifier.parent;
  return parent !== undefined && EXPORT_TYPES.has(parent.type);
}

/** Whether a declaration is exported, from the file or from a namespace. */
function isExportedDeclaration(identifier: TSESTree.Identifier): boolean {
  const declaration = declarationOf(identifier);
  const parent = declaration?.parent;
  return parent !== undefined && EXPORT_TYPES.has(parent.type);
}

/**
 * Whether every use of these variables is in this file and known to scope
 * analysis, so renaming them here renames them everywhere. A variable is not
 * private when it is exported in any form, declared in an ambient module or
 * at the top of a script, or when a reference of the same name is left
 * unresolved and might have meant it.
 */
export function isFilePrivate(source: ExplicitSourceCode, variables: ScopeVariable[]): boolean {
  const unresolved = source.scopeManager?.globalScope?.through ?? [];
  return variables.every((variable) => {
    if (
      variable.references.some(isExportingReference) ||
      unresolved.some(
        (reference) =>
          reference.identifier.type === "Identifier" && reference.identifier.name === variable.name,
      )
    ) {
      return false;
    }
    return variable.identifiers.every(
      (identifier) =>
        !isExportedDeclaration(identifier) &&
        !inAmbientModule(identifier) &&
        (!TOP_LEVEL_SCOPE_TYPES.has(variable.scope.type) || isModule(programOf(identifier))),
    );
  });
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
 * `name` already appears in the file and the rename could capture or shadow it.
 */
export function renameFix(
  source: ExplicitSourceCode,
  identifier: TSESTree.Identifier,
  name: string,
): Rename | null {
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
