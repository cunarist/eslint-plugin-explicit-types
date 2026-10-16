/**
 * Telling whether a declared name is private to its file, which is what makes
 * a rename safe to apply as a fix, and finding the statement that declares it.
 */

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
export function sameRange(left: TSESTree.Node, right: TSESTree.Node): boolean {
  return left.range[0] === right.range[0] && left.range[1] === right.range[1];
}

/**
 * The declaration statement a declared identifier belongs to: its variable
 * declaration, or the class, function, or type it names. `null` for a
 * parameter or any other name that no statement declares.
 */
export function declarationOf(identifier: TSESTree.Identifier): TSESTree.Node | null {
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
