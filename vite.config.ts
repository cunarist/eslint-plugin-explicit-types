import { defineConfig } from "vite-plus";

import explicitTypes from "#plugin";

import projectLint, { projectOverrides } from "./scripts/project-lint.ts";

export default defineConfig({
  lint: {
    plugins: ["typescript", "unicorn", "oxc", "import"],
    // Lints itself from source; `scripts/project-lint.ts` holds the repo's own
    // rule list and repo-only rules, never published.
    jsPlugins: ["./src/plugin/index.ts", "./scripts/project-lint.ts"],
    categories: {
      correctness: "error",
      suspicious: "error",
      pedantic: "error",
      perf: "error",
      style: "error",
      restriction: "error",
    },
    rules: { ...explicitTypes.configs.all.rules, ...projectLint.configs.project.rules },
    overrides: projectOverrides,
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
