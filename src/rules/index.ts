/**
 * Every rule in the plugin, one file each, registered here by rule id. Which
 * configs turn a rule on is decided in `src/plugin/index.ts`, not here, because a rule
 * can belong to more than one config.
 */

import type { ExplicitRule } from "#helpers";

import { noConditionalTypesRule } from "./no-conditional-types.ts";
import { noEnumRule } from "./no-enum.ts";
import { noIndexSignaturesRule } from "./no-index-signatures.ts";
import { noInlineObjectTypesRule } from "./no-inline-object-types.ts";
import { noKeyofRule } from "./no-keyof.ts";
import { noMappedTypesRule } from "./no-mapped-types.ts";
import { noOptionalNullRule } from "./no-optional-null.ts";
import { noTypeAssertionRule } from "./no-type-assertion.ts";
import { noTypeofTypeRule } from "./no-typeof-type.ts";
import { noUndefinedTypeRule } from "./no-undefined-type.ts";
import { noUpperSnakeObjectKeysRule } from "./no-upper-snake-object-keys.ts";
import { noUtilityTypesRule } from "./no-utility-types.ts";
import { pascalCaseTypesRule } from "./pascal-case-types.ts";
import { requireReturnTypeRule } from "./require-return-type.ts";
import { singleCapitalTypeParamsRule } from "./single-capital-type-params.ts";
import { upperSnakeStringUnionsRule } from "./upper-snake-string-unions.ts";

/**
 * Every rule, keyed by rule id, in alphabetical order.
 *
 * A `Map` rather than an object literal: a rule record is a lookup keyed by
 * rule id, so the ids belong in value position. This is
 * `no-upper-snake-object-keys` applied to itself.
 */
export const rules: Map<string, ExplicitRule> = new Map([
  ["no-conditional-types", noConditionalTypesRule],
  ["no-enum", noEnumRule],
  ["no-index-signatures", noIndexSignaturesRule],
  ["no-inline-object-types", noInlineObjectTypesRule],
  ["no-keyof", noKeyofRule],
  ["no-mapped-types", noMappedTypesRule],
  ["no-optional-null", noOptionalNullRule],
  ["no-type-assertion", noTypeAssertionRule],
  ["no-typeof-type", noTypeofTypeRule],
  ["no-undefined-type", noUndefinedTypeRule],
  ["no-upper-snake-object-keys", noUpperSnakeObjectKeysRule],
  ["no-utility-types", noUtilityTypesRule],
  ["pascal-case-types", pascalCaseTypesRule],
  ["require-return-type", requireReturnTypeRule],
  ["single-capital-type-params", singleCapitalTypeParamsRule],
  ["upper-snake-string-unions", upperSnakeStringUnionsRule],
]);
