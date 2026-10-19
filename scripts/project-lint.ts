/**
 * `project` - lint rules this repository holds its own source to that are not
 * part of the published plugin: the rule list in `configs.project`, and its
 * own rules, each in a flat `scripts/project-lint-*.ts` file:
 * `prefer-ascii` and `no-disable-comments` (`project-lint-source.ts`),
 * `no-asset-imports` (`project-lint-modules.ts`), and ports of the hugoalh
 * `recommended` rules Oxlint lacks (`project-lint-hugoalh.ts`,
 * `project-lint-hugoalh-types.ts`).
 *
 * Loaded by `vite.config.ts` as an Oxlint `jsPlugins` entry, never packed:
 * `vp pack` builds `src/plugin/index.ts` alone and the tarball holds only
 * `dist/`.
 *
 * @module
 */

import type { DummyRuleMap, OxlintOverride } from "vite-plus/lint";

import {
  noDuplicateInterfacesRule,
  noDuplicateTypesRule,
  noModifierPrivateRule,
  noUselessTypeRule,
} from "./project-lint-hugoalh-types.ts";
import {
  noDuplicateTypeofsRule,
  noEmptyYieldRule,
  noNanRule,
  noUnsafeNumberRule,
  noUselessContinueRule,
} from "./project-lint-hugoalh.ts";
import { noAssetImportsRule } from "./project-lint-modules.ts";
import { noDisableCommentsRule, preferAsciiRule } from "./project-lint-source.ts";

/**
 * This repository's own rule list, spread by `vite.config.ts` after the
 * published `all` config. Every Oxlint category except `nursery` is on, so
 * this list holds only the repo's own rules, opt-outs, and option tweaks.
 * Built-in Oxlint rule ids sit here too, so `vite.config.ts` lists no rule
 * by name.
 */
const rules: DummyRuleMap = {
  // The repo's own rules.
  "project/no-disable-comments": "error",
  "project/no-asset-imports": "error",
  // Deno's `prefer-ascii`, which also covers hugoalh's
  // `prefer-ascii-identifier`.
  "project/prefer-ascii": "error",
  // Ports of the hugoalh `recommended` rules with no Oxlint built-in, under
  // their hugoalh names.
  "project/no-duplicate-interfaces": "error",
  "project/no-duplicate-typeofs": "error",
  "project/no-duplicate-types": "error",
  "project/no-empty-yield": "error",
  "project/no-modifier-private": "error",
  "project/no-nan": "error",
  "project/no-unsafe-number": "error",
  "project/no-useless-continue": "error",
  "project/no-useless-type": "error",

  // Option tweaks. First, camelCase names: no `_` inside the name once
  // leading and trailing ones are trimmed, unless it has no lowercase ASCII
  // letter (UPPER_SNAKE). Shorthand destructuring binds a key the code does
  // not own, and property names are not declarations.
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
  "no-restricted-globals": ["error", "window"],
  "one-var": ["error", "never"],
  "no-use-before-define": ["error", { functions: false }],
  "func-style": ["error", "declaration", { allowArrowFunctions: true }],
  // Limits set to the smallest values the current code passes.
  "max-statements": ["error", { max: 21 }],
  "max-params": ["error", { max: 4 }],
  // Single capital type parameters (`T`) are the naming preset's rule.
  "id-length": ["error", { exceptionPatterns: ["^[A-Z]$"] }],

  // Off: fights the AST types, whose nodes are mutable and whose `type` is
  // an enum imported only as a type.
  "typescript/no-unsafe-enum-comparison": "off",

  // Off, collides with this repo's or the published plugin's conventions.
  // Collides with explicit-types' written-out types and mutable AST nodes.
  "typescript/prefer-readonly-parameter-types": "off",
  // Collides with plain TypeScript classes: no `public` noise.
  "typescript/explicit-member-accessibility": "off",
  // Collides with mutable private state the code writes on purpose.
  "typescript/prefer-readonly": "off",
  // Collides with explicit-types' no-index-signatures and no-utility-types.
  "typescript/consistent-indexed-object-style": "off",
  // Collides with explicit-types' written-out annotations.
  "typescript/no-inferrable-types": "off",
  // Collides with Oxfmt's import sorting.
  "sort-imports": "off",
  // Collides with the `index.ts` barrels the `#` aliases point at.
  "oxc/no-barrel-file": "off",
  // Collides with exporting each declaration where it is written.
  "import/group-exports": "off",
  // Collides with exporting each declaration where it is written.
  "import/exports-last": "off",
  // Collides with named exports, the rule files' convention.
  "import/prefer-default-export": "off",
  // Collides with the default-exported plugin objects.
  "import/no-named-export": "off",
  // Collides with consistent-type-imports' top-level `import type`.
  "import/consistent-type-specifier-style": "off",
  // Collides with the default exports the plugin entry and configs require.
  "import/no-default-export": "off",
  // Collides with RuleTester cases, whose code strings hold template literals.
  "no-template-curly-in-string": "off",
  // Collides with the bivariant method signatures the RuleTester types need.
  "typescript/method-signature-style": "off",
  // Collides with ordinary modern TypeScript.
  "no-ternary": "off",
  // Collides with ordinary modern TypeScript.
  "oxc/no-async-await": "off",
  // Collides with ordinary modern TypeScript.
  "oxc/no-optional-chaining": "off",
  // Collides with flags and hashing where bit operators are the point.
  "no-bitwise": "off",
  // Collides with explicit-types' absence preset, which spells absence.
  "no-undefined": "off",
  // Collides with no-floating-promises' `void` for fire-and-forget calls.
  "no-void": "off",
  // Collides with explicit-types' absence preset, which uses `| null`.
  "unicorn/no-null": "off",

  // Off: TypeScript's type checking already proves switches exhaustive.
  "typescript/switch-exhaustiveness-check": "off",
  // Off: not type-aware; `noImplicitReturns` covers missing returns.
  "consistent-return": "off",
  // Off: sequential awaits in loops are intentional; workarounds cost more.
  "no-await-in-loop": "off",

  // Off, too much churn for what it buys.
  "no-magic-numbers": "off",
  "sort-keys": "off",
  "capitalized-comments": "off",
  "typescript/explicit-function-return-type": "off",
  "typescript/explicit-module-boundary-types": "off",
  "no-empty-function": "off",
  "class-methods-use-this": "off",
  "unicorn/switch-case-braces": "off",
  "prefer-destructuring": "off",
  "oxc/no-rest-spread-properties": "off",
  "unicorn/numeric-separators-style": "off",
  "no-continue": "off",

  // Off, Node code: the plugin, its tests, and its tooling all run on Node.
  "import/no-nodejs-modules": "off",
};

/** Node code (`vite.config.ts` and `scripts/`): the first override's rules. */
const nodeRules: DummyRuleMap = {
  // Vite and the Oxlint plugin host read a default export.
  "import/no-default-export": "off",
  // Node code: tooling imports Node's built-ins.
  "import/no-nodejs-modules": "off",
  // Node code: a CLI exits with a status.
  "unicorn/no-process-exit": "off",
  // Node code: a CLI reports to the console.
  "no-console": "off",
};

/**
 * The whole `overrides` array `vite.config.ts` uses as is. The Node code entry
 * comes first; per-file exceptions follow, each with a comment saying why.
 * A later entry wins over an earlier one, and every entry wins over `rules`.
 */
export const projectOverrides: OxlintOverride[] = [
  { files: ["vite.config.ts", "scripts/**"], rules: nodeRules },
  // The rule registry imports every rule file by design.
  { files: ["src/rules/index.ts"], rules: { "import/max-dependencies": "off" } },
];

/**
 * The repo-local plugin, namespace `project`: its own rules, enabled as
 * `project/<rule>`, and `configs.project`, the rule list above.
 */
const plugin = {
  meta: { name: "project" },
  rules: {
    "no-disable-comments": noDisableCommentsRule,
    "no-asset-imports": noAssetImportsRule,
    "prefer-ascii": preferAsciiRule,
    "no-duplicate-interfaces": noDuplicateInterfacesRule,
    "no-duplicate-typeofs": noDuplicateTypeofsRule,
    "no-duplicate-types": noDuplicateTypesRule,
    "no-empty-yield": noEmptyYieldRule,
    "no-modifier-private": noModifierPrivateRule,
    "no-nan": noNanRule,
    "no-unsafe-number": noUnsafeNumberRule,
    "no-useless-continue": noUselessContinueRule,
    "no-useless-type": noUselessTypeRule,
  },
  configs: { project: { rules } },
};

export default plugin;
