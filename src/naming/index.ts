/**
 * The `naming` preset — names carry the contract.
 *
 * Requires PascalCase type names and UPPER_SNAKE_CASE string union members,
 * keeps that casing out of object keys, and bans `enum`.
 */

import type { ExplicitRule } from "#helpers";

import { noEnum } from "./no-enum.ts";
import { noUpperSnakeObjectKeys } from "./no-upper-snake-object-keys.ts";
import { pascalCaseTypes } from "./pascal-case-types.ts";
import { upperSnakeStringUnions } from "./upper-snake-string-unions.ts";

/**
 * The `naming` rules, keyed by rule id.
 *
 * A `Map` rather than an object literal: a rule record is a lookup keyed by
 * rule id, so the ids belong in value position. This is
 * `no-upper-snake-object-keys` applied to itself.
 */
export const namingRules: Map<string, ExplicitRule> = new Map([
  ["pascal-case-types", pascalCaseTypes],
  ["upper-snake-string-unions", upperSnakeStringUnions],
  ["no-upper-snake-object-keys", noUpperSnakeObjectKeys],
  ["no-enum", noEnum],
]);
