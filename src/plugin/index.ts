/**
 * `eslint-plugin-explicit-types` - TypeScript types written out
 * rather than derived, and names that carry their contract.
 *
 * One plugin, namespace `explicit-types`, so a rule id reads
 * `explicit-types/no-keyof`. The rules come in three presets -
 * `concrete`, `naming`, and `absence` - plus `all`, which turns on every
 * rule. The plugin is the only export; its configs are at `plugin.configs`.
 *
 * @module
 */

import type { ConfigObject, Plugin } from "@eslint/core";

import { rules } from "#rules";

/** The prefix of every rule id, as ESLint derives it from the package name. */
const NAMESPACE = "explicit-types";

/**
 * The `concrete` preset - write the type out instead of deriving it.
 *
 * Bans every way of leaving a type implicit: utility types, `keyof`, `typeof`,
 * mapped types, index signatures, conditional types, assertions, and
 * `satisfies`. Named functions must declare a return type.
 */
const CONCRETE: string[] = [
  "no-utility-types",
  "no-keyof",
  "no-typeof-type",
  "no-mapped-types",
  "no-index-signatures",
  "no-inline-object-types",
  "no-conditional-types",
  "require-return-type",
  "no-type-assertion",
  "no-satisfies",
];

/**
 * The `naming` preset - names carry the contract.
 *
 * Requires PascalCase type names, single capital type parameters, and
 * UPPER_SNAKE_CASE string union members, keeps that casing out of object keys,
 * and bans `enum`.
 */
const NAMING: string[] = [
  "pascal-case-types",
  "single-capital-type-params",
  "upper-snake-string-unions",
  "no-upper-snake-object-keys",
  "no-enum",
];

/**
 * The `absence` preset - one spelling for an absent value.
 *
 * A member or parameter says absence with `?`; a return type or variable, which
 * cannot take `?`, says it with `| null`. Never both, and never the `undefined`
 * keyword.
 */
const ABSENCE: string[] = ["no-undefined-type", "no-optional-null"];

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
    // Written out rather than imported from `package.json`, so the source has
    // only `.ts` imports. A release bumps both; `tests/package-meta.test.ts`
    // fails if they drift apart.
    name: "eslint-plugin-explicit-types",
    version: "0.7.0",
    namespace: NAMESPACE,
  },
  rules: Object.fromEntries(rules),
};

/**
 * A flat config that loads the plugin and turns every given rule on. A config
 * is only a list of rule ids, so one rule can sit in several configs.
 */
function presetConfig(preset: string, ruleIds: string[]): ConfigObject {
  return {
    name: `${NAMESPACE}/${preset}`,
    plugins: Object.fromEntries([[NAMESPACE, basePlugin]]),
    rules: Object.fromEntries(ruleIds.map((id) => [`${NAMESPACE}/${id}`, "error"])),
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
    concrete: presetConfig("concrete", CONCRETE),
    naming: presetConfig("naming", NAMING),
    absence: presetConfig("absence", ABSENCE),
    all: presetConfig("all", [...rules.keys()]),
  },
});

export default plugin;
