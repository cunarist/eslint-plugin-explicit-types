import { describe, expect, it } from "vite-plus/test";

import plugin from "#plugin";

const NAMESPACE = "explicit-types";

/**
 * Every published rule: the 15 original rules, plus
 * `single-capital-type-params`, the first rule added since. A
 * repo-only rule goes in `scripts/project-lint.ts`, never in the published
 * plugin.
 */
const PUBLISHED_RULES: string[] = [
  "no-conditional-types",
  "no-enum",
  "no-index-signatures",
  "no-inline-object-types",
  "no-keyof",
  "no-mapped-types",
  "no-optional-null",
  "no-type-assertion",
  "no-typeof-type",
  "no-undefined-type",
  "no-upper-snake-object-keys",
  "no-utility-types",
  "pascal-case-types",
  "require-return-type",
  "single-capital-type-params",
  "upper-snake-string-unions",
];

describe("plugin.rules", () => {
  it("holds exactly the 16 published rules", () => {
    expect(Object.keys(plugin.rules ?? {}).toSorted()).toEqual(PUBLISHED_RULES);
  });
});

describe("plugin.configs.all", () => {
  it("turns on every rule in the plugin", () => {
    expect(Object.keys(plugin.configs.all.rules ?? {})).toHaveLength(16);
    const ruleIds = Object.keys(plugin.rules ?? {}).map((id) => `${NAMESPACE}/${id}`);
    expect(Object.keys(plugin.configs.all.rules ?? {}).toSorted()).toEqual(ruleIds.toSorted());
  });

  it("equals the union of the three preset configs", () => {
    expect(plugin.configs.all.rules).toEqual({
      ...plugin.configs.concrete.rules,
      ...plugin.configs.naming.rules,
      ...plugin.configs.absence.rules,
    });
  });
});
