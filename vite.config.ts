import { defineConfig } from "vite-plus";

import projectLint from "./scripts/project-lint.ts";
import explicitTypes from "./src/plugin/index.ts";

export default defineConfig({
  lint: {
    plugins: ["typescript", "unicorn", "oxc", "import"],
    // Lints itself from source; `scripts/project-lint.ts` holds the repo's own
    // rule list and repo-only rules, never published.
    jsPlugins: ["./src/plugin/index.ts", "./scripts/project-lint.ts"],
    categories: { correctness: "error", suspicious: "error", pedantic: "error", perf: "error" },
    rules: { ...explicitTypes.configs.all.rules, ...projectLint.configs.project.rules },
    // The rule registry must import every rule, past max-dependencies' 10.
    overrides: [{ files: ["src/rules/index.ts"], rules: { "import/max-dependencies": "off" } }],
    options: {
      typeAware: true,
      typeCheck: true,
      maxWarnings: 0,
      reportUnusedDisableDirectives: "error",
    },
  },
  pack: {
    entry: "src/plugin/index.ts",
    dts: true,
    fixedExtension: false,
  },
});
