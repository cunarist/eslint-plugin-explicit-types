import type { LanguageOptions, RuleDefinition, RuleVisitor, TextSourceCode } from "@eslint/core";
import type { TSESTree } from "@typescript-eslint/types";

/** One use of a variable, as both hosts' scope managers record it. */
export interface ScopeReference {
  identifier: TSESTree.Node;
}

/** The scope a variable is declared in, e.g. `module` or `function`. */
export interface Scope {
  type: string;
}

/** A host's global scope, whose `through` lists every reference left unresolved. */
export interface GlobalScope {
  through: ScopeReference[];
}

/** A host's scope analysis, as far as the rules read it. */
export interface ScopeManager {
  globalScope: GlobalScope | null;
}

/** A declared name with every place it is declared and used. */
export interface ScopeVariable {
  name: string;
  scope: Scope;
  identifiers: TSESTree.Identifier[];
  references: ScopeReference[];
}

/**
 * The source code both hosts hand a TypeScript rule: its text, plus the scope
 * lookup ESLint and Oxlint each implement on it.
 */
export interface ExplicitSourceCode extends TextSourceCode {
  scopeManager: ScopeManager | null;
  getDeclaredVariables: (node: TSESTree.Node) => ScopeVariable[];
}

/**
 * The type parameters of every rule in this package: ESLint's defaults, except
 * that a report points at a TypeScript-ESTree node.
 *
 * `Visitor` stays ESLint's loose `RuleVisitor`, so each visitor annotates its
 * node parameter itself. The type-aware `no-unsafe-*` lint rules in
 * `vite.config.ts` catch a parameter left as `any`.
 */
export interface ExplicitRuleTypes {
  LangOptions: LanguageOptions;
  Code: ExplicitSourceCode;
  RuleOptions: [];
  Visitor: RuleVisitor;
  Node: TSESTree.Node;
  MessageIds: string;
  ExtRuleDocs: unknown;
}

/** A rule in this package, in ESLint's standard `create` form. */
export type ExplicitRule = RuleDefinition<ExplicitRuleTypes>;
