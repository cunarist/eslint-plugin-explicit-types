/**
 * `@cunarist/eslint-plugin-explicit-types` — TypeScript types written out
 * rather than derived, and names that carry their contract.
 *
 * One plugin, namespace `@cunarist/explicit-types`, so a rule id reads
 * `@cunarist/explicit-types/no-keyof`. The rules come in three presets —
 * `concrete`, `naming`, and `absence` — each exported as an ESLint flat config.
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

/** The plugin, for ESLint `plugins` or Oxlint `jsPlugins`. */
const plugin: Plugin = {
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
    plugins: Object.fromEntries([[NAMESPACE, plugin]]),
    rules: Object.fromEntries([...rules.keys()].map((id) => [`${NAMESPACE}/${id}`, "error"])),
  };
}

/** The `concrete` preset: write the type out instead of deriving it. */
export const concreteConfig: ConfigObject = presetConfig("concrete", concreteRules);

/** The `naming` preset: names carry the contract. */
export const namingConfig: ConfigObject = presetConfig("naming", namingRules);

/** The `absence` preset: one spelling for an absent value. */
export const absenceConfig: ConfigObject = presetConfig("absence", absenceRules);

plugin.configs = Object.fromEntries([
  ["concrete", concreteConfig],
  ["naming", namingConfig],
  ["absence", absenceConfig],
]);

export default plugin;
