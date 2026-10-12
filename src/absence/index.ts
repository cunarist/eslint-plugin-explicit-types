/**
 * The `absence` preset — one spelling for an absent value.
 *
 * A member or parameter says absence with `?`; a return type or variable, which
 * cannot take `?`, says it with `| null`. Never both, and never the `undefined`
 * keyword.
 */

import type { ExplicitRule } from "#helpers";

import { noOptionalNull } from "./no-optional-null.ts";
import { noUndefinedType } from "./no-undefined-type.ts";

/**
 * The `absence` rules, keyed by rule id.
 *
 * A `Map` rather than an object literal: a rule record is a lookup keyed by
 * rule id, so the ids belong in value position. This is
 * `no-upper-snake-object-keys` applied to itself.
 */
export const absenceRules: Map<string, ExplicitRule> = new Map([
  ["no-undefined-type", noUndefinedType],
  ["no-optional-null", noOptionalNull],
]);
