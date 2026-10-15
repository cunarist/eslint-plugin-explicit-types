import { describe, expect, it } from "vite-plus/test";

import plugin from "#plugin";

const NAMESPACE = "@cunarist/explicit-types";

describe("plugin.configs.all", () => {
  it("turns on every rule in the plugin", () => {
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
