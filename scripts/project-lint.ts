/**
 * `project` — lint rules this repository holds its own source to that are not
 * part of the published plugin. The published plugin mirrors the rules of the
 * Deno plugin `jsr:@cunarist/deno-lint-plugin-explicit-types` and nothing
 * else; a rule kept here only for this repo's lint parity lives in this file.
 * It holds no rule of its own today: Deno's `camelcase` is Oxlint's `id-match`.
 *
 * Loaded by `vite.config.ts` as an Oxlint `jsPlugins` entry, never packed:
 * `vp pack` builds `src/index.ts` alone and the tarball holds only `dist/`.
 *
 * @module
 */

import type { DummyRuleMap } from "vite-plus/lint";

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
 * The repo-local plugin, namespace `project`. Its `rules` is empty but kept, so
 * `vite.config.ts` loads it in `jsPlugins` unchanged and a repo-only rule has a
 * home as `project/<rule>`. `configs.project` carries the rule list above.
 */
const plugin = {
  meta: { name: "project" },
  rules: {},
  configs: { project: { rules } },
};

export default plugin;
