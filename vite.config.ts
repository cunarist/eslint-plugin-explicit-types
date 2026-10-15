import { defineConfig } from "vite-plus";

import plugin from "./src/index.ts";

export default defineConfig({
  fmt: {
    // Keep package.json in its hand-written order: metadata first, then
    // `scripts`, `exports`, `imports`, and the dependency lists.
    sortPackageJson: false,
  },
  lint: {
    plugins: ["typescript", "unicorn", "oxc", "import"],
    // Lints itself from source, so a new rule applies to its own code.
    jsPlugins: ["./src/index.ts"],
    categories: { correctness: "error", suspicious: "error", pedantic: "error" },
    rules: {
      ...plugin.configs.all.rules,
      // Deno lint parity beyond the categories above.
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
      "typescript/switch-exhaustiveness-check": [
        "error",
        { considerDefaultExhaustiveForUnions: true },
      ],
      "max-lines": "off",
      "max-lines-per-function": "off",
    },
    overrides: [
      {
        // The rule registry imports every rule, one file each, by design.
        files: ["src/rules/index.ts"],
        rules: { "import/max-dependencies": "off" },
      },
    ],
    options: {
      typeAware: true,
      typeCheck: true,
      maxWarnings: 0,
      reportUnusedDisableDirectives: "error",
    },
  },
  pack: {
    entry: "src/index.ts",
    dts: true,
    deps: { onlyBundle: ["@eslint/core", "@types/json-schema"] },
    fixedExtension: false,
  },
});
