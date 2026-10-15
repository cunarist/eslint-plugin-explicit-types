/**
 * `@cunarist/eslint-plugin-explicit-types` — TypeScript types written out
 * rather than derived, and names that carry their contract.
 *
 * One plugin, namespace `@cunarist/explicit-types`, so a rule id reads
 * `@cunarist/explicit-types/no-keyof`. The rules come in three presets —
 * `concrete`, `naming`, and `absence` — plus `all`, which turns on every
 * rule. The plugin is the only export; its configs are at `plugin.configs`.
 *
 * @module
 */

import type { ConfigObject, Plugin } from "@eslint/core";

import { absenceRules } from "./absence/index.ts";
import { concreteRules } from "./concrete/index.ts";
import type { ExplicitRule } from "#helpers";
import { namingRules } from "./naming/index.ts";
import packageJson from "#package" with { type: "json" };

/** The prefix of every rule id, as ESLint derives it from the package name. */
const NAMESPACE = "@cunarist/explicit-types";

/** Every rule in the plugin, keyed by rule id. */
const allRules: Map<string, ExplicitRule> = new Map([
  ...concreteRules,
  ...namingRules,
  ...absenceRules,
]);

/** The flat configs at `plugin.configs`, one per preset plus `all`. */
interface ExplicitTypesConfigs {
  concrete: ConfigObject;
  naming: ConfigObject;
  absence: ConfigObject;
  all: ConfigObject;
}

/** The plugin, with its configs known by name. */
interface ExplicitTypesPlugin {
  meta?: Plugin["meta"];
  rules?: Plugin["rules"];
  configs: ExplicitTypesConfigs;
}

/** The plugin before its configs exist, which each config refers back to. */
const basePlugin: Plugin = {
  meta: {
    name: packageJson.name,
    version: packageJson.version,
    namespace: NAMESPACE,
  },
  rules: Object.fromEntries(allRules),
};

/** A flat config that loads the plugin and turns every given rule on. */
function presetConfig(preset: string, rules: Map<string, ExplicitRule>): ConfigObject {
  return {
    name: `${NAMESPACE}/${preset}`,
    plugins: Object.fromEntries([[NAMESPACE, basePlugin]]),
    rules: Object.fromEntries([...rules.keys()].map((id) => [`${NAMESPACE}/${id}`, "error"])),
  };
}

/**
 * The plugin, for ESLint `plugins` or Oxlint `jsPlugins`, and the package's
 * only export. Configs: `concrete` writes the type out instead of deriving it,
 * `naming` makes names carry the contract, `absence` gives an absent value one
 * spelling, and `all` turns on every rule, so a new rule joins it by itself.
 */
const plugin: ExplicitTypesPlugin = Object.assign(basePlugin, {
  configs: {
    concrete: presetConfig("concrete", concreteRules),
    naming: presetConfig("naming", namingRules),
    absence: presetConfig("absence", absenceRules),
    all: presetConfig("all", allRules),
  },
});

export default plugin;
