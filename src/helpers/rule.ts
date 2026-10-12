import type { LanguageOptions, RuleDefinition, RuleVisitor, SourceCode } from "@eslint/core";
import type { TSESTree } from "@typescript-eslint/types";

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
  Code: SourceCode;
  RuleOptions: [];
  Visitor: RuleVisitor;
  Node: TSESTree.Node;
  MessageIds: string;
  ExtRuleDocs: unknown;
}

/** A rule in this package, in ESLint's standard `create` form. */
export type ExplicitRule = RuleDefinition<ExplicitRuleTypes>;
