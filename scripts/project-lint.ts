/**
 * `project` — lint rules this repository holds its own source to that are not
 * part of the published plugin. The published plugin mirrors the rules of the
 * Deno plugin `jsr:@cunarist/deno-lint-plugin-explicit-types` and nothing
 * else; a rule kept here only for this repo's lint parity lives in this file.
 * Its one rule of its own is `no-disable-comments`; Deno's `camelcase` is
 * Oxlint's built-in `id-match`.
 *
 * Loaded by `vite.config.ts` as an Oxlint `jsPlugins` entry, never packed:
 * `vp pack` builds `src/index.ts` alone and the tarball holds only `dist/`.
 *
 * @module
 */

import type { RuleDefinition } from "@eslint/core";
import type { TSESTree } from "@typescript-eslint/types";
import type { DummyRuleMap } from "vite-plus/lint";

import type { ExplicitRuleTypes, ExplicitSourceCode } from "#helpers";

/** The published rules' source code, plus the comment list both hosts provide. */
interface ProjectSourceCode extends ExplicitSourceCode {
  getAllComments(): TSESTree.Comment[];
}

/** The published rules' type parameters, with comments readable. */
interface ProjectRuleTypes extends ExplicitRuleTypes {
  Code: ProjectSourceCode;
}

/** A repo-local rule, in ESLint's standard `create` form. */
type ProjectRule = RuleDefinition<ProjectRuleTypes>;

/** A comment that turns lint rules off or back on, in ESLint or Oxlint form. */
const DIRECTIVE_PATTERN: RegExp = /^\s*(?:eslint|oxlint)-(?:disable|enable)/u;

/** This rule's own name, which a directive may not use to silence it. */
const RULE_NAME: string = "no-disable-comments";

/**
 * `no-disable-comments` — rejects every `eslint-disable*`, `eslint-enable*`,
 * `oxlint-disable*`, and `oxlint-enable*` comment, line or block. Oxlint has
 * no `noInlineConfig` and no `eslint-comments` rules, so this repo bans them
 * itself: when a rule fires, fix the source.
 *
 * A directive can silence the report on itself, so two built-in checks close
 * the gaps: `unicorn/no-abusive-eslint-disable` fails one that names no rule,
 * and this rule skips one that names it, which then silences nothing and fails
 * `reportUnusedDisableDirectives` in `vite.config.ts`.
 */
const noDisableCommentsRule: ProjectRule = {
  meta: {
    type: "problem",
    docs: { description: "Disallow lint disable and enable comments" },
    schema: [],
    messages: { directive: "Lint disable comments are not allowed; fix the source." },
  },
  create(context) {
    return {
      Program(_node: TSESTree.Program): void {
        for (const comment of context.sourceCode.getAllComments()) {
          if (DIRECTIVE_PATTERN.test(comment.value) && !comment.value.includes(RULE_NAME)) {
            context.report({ loc: comment.loc, messageId: "directive" });
          }
        }
      },
    };
  },
};

/**
 * This repository's own rule list, spread by `vite.config.ts` after the
 * published `all` config: Deno lint parity beyond the Oxlint categories, plus a
 * few extras and opt-outs. Built-in Oxlint rule ids sit here too, so
 * `vite.config.ts` lists no rule by name.
 */
const rules: DummyRuleMap = {
  // Deno lint parity beyond the categories in `vite.config.ts`. First,
  // Deno's `camelcase`: no `_` inside the name once leading and trailing
  // ones are trimmed, unless it has no lowercase ASCII letter
  // (UPPER_SNAKE). Shorthand destructuring binds a key the code does
  // not own, and property names are not declarations, as in Deno.
  "id-match": [
    "error",
    "^_*[^_]*_*$|^[^a-z]*$",
    {
      properties: false,
      classFields: false,
      onlyDeclarations: false,
      ignoreDestructuring: true,
    },
  ],
  curly: "error",
  "guard-for-in": "error",
  "no-console": "error",
  "no-empty": "error",
  "no-regex-spaces": "error",
  "no-restricted-globals": ["error", "window"],
  "no-var": "error",
  "prefer-const": "error",
  "import/no-cycle": "error",
  "import/no-relative-parent-imports": "error",
  "typescript/adjacent-overload-signatures": "error",
  "typescript/consistent-type-imports": "error",
  "typescript/no-empty-interface": "error",
  "typescript/no-explicit-any": "error",
  "typescript/no-namespace": "error",
  "typescript/no-non-null-assertion": "error",
  "project/no-disable-comments": "error",
  "unicorn/no-abusive-eslint-disable": "error",
  // Pedantic rules that fight the AST types: nodes are mutable, `type` is
  // an enum imported only as a type, and visitors are long by nature.
  "typescript/prefer-readonly-parameter-types": "off",
  "typescript/no-unsafe-enum-comparison": "off",
  "typescript/switch-exhaustiveness-check": ["error", { considerDefaultExhaustiveForUnions: true }],
  "max-lines": "off",
  "max-lines-per-function": "off",
};

/**
 * The repo-local plugin, namespace `project`: its own rules, enabled as
 * `project/<rule>`, and `configs.project`, the rule list above.
 */
const plugin = {
  meta: { name: "project" },
  rules: { "no-disable-comments": noDisableCommentsRule },
  configs: { project: { rules } },
};

export default plugin;
