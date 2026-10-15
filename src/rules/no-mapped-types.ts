import type { RuleTextEdit, RuleTextEditor } from "@eslint/core";
import type { TSESTree } from "@typescript-eslint/types";

import { docsUrl, type ExplicitRule } from "#helpers";

/** `OPEN`, `IN_PROGRESS` — a member name `no-upper-snake-object-keys` rejects. */
const UPPER_SNAKE_CASE_PATTERN = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/u;

/** A member name that needs no quotes and that `camelcase` accepts as written. */
const PLAIN_KEY_PATTERN = /^[A-Za-z$][A-Za-z0-9$]*$/u;

/** The literal keys a mapped type's constraint lists, or `null` if it is not only literals. */
function literalKeys(constraint: TSESTree.TypeNode): string[] | null {
  const members = constraint.type === "TSUnionType" ? constraint.types : [constraint];
  const keys = new Set<string>();
  for (const member of members) {
    if (member.type !== "TSLiteralType" || member.literal.type !== "Literal") {
      return null;
    }
    const value = member.literal.value;
    if (typeof value !== "string" && typeof value !== "number") {
      return null;
    }
    keys.add(String(value));
  }
  return [...keys];
}

/** A member key as an interface spells it. */
function memberKey(key: string): string {
  return PLAIN_KEY_PATTERN.test(key) || /^\d+$/u.test(key) ? key : JSON.stringify(key);
}

/**
 * The `interface` a type alias of a mapped type spells out, when its keys are
 * a written-out list of literals and its value does not depend on the key.
 * `null` when the fields cannot be listed from syntax alone, or when listing
 * them would break another rule of this plugin.
 */
function interfaceText(node: TSESTree.TSMappedType, text: string): string | null {
  const alias = node.parent;
  const value = node.typeAnnotation ?? null;
  if (alias.type !== "TSTypeAliasDeclaration" || node.nameType !== null || value === null) {
    return null;
  }
  const keys = literalKeys(node.constraint);
  if (keys === null || keys.some((key) => UPPER_SNAKE_CASE_PATTERN.test(key))) {
    return null;
  }
  const aliasText = text.slice(alias.range[0], alias.range[1]);
  const valueText = text.slice(value.range[0], value.range[1]);
  const keyPattern = new RegExp(
    `(?<![\\w$])${node.key.name.replaceAll("$", "\\$")}(?![\\w$])`,
    "u",
  );
  if (aliasText.includes("/") || keyPattern.test(valueText)) {
    return null;
  }
  // A bare or `+` modifier adds to each member; a `-` one has nothing to remove.
  const optional = node.optional === true || node.optional === "+" ? "?" : "";
  // `no-optional-null` rejects an optional member that also admits `null`.
  if (optional !== "" && /\bnull\b/u.test(valueText)) {
    return null;
  }
  const readonly = node.readonly === true || node.readonly === "+" ? "readonly " : "";
  const members = keys.map((key) => `${readonly}${memberKey(key)}${optional}: ${valueText}`);
  // Oxlint leaves an absent list `null` where ESLint leaves it `undefined`.
  const parameters = alias.typeParameters ?? null;
  const typeParameters =
    parameters === null ? "" : text.slice(parameters.range[0], parameters.range[1]);
  const declare = alias.declare ? "declare " : "";
  return `${declare}interface ${alias.id.name}${typeParameters} { ${members.join("; ")} }`;
}

/**
 * `no-mapped-types` — rejects mapped types — `{ [K in Keys]: T }`.
 *
 * A mapped type generates its fields from another type. Nothing in the source
 * lists what the object actually has, so the shape can only be read by
 * evaluating the mapping.
 */
export const noMappedTypesRule: ExplicitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow mapped types",
      url: docsUrl("no-mapped-types"),
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      mappedType:
        "Mapped type. Write the fields out, or use a `Map` if the keys are genuinely dynamic.",
      writeInterface: "Write the fields out as an `interface`.",
    },
  },
  create(context) {
    return {
      TSMappedType(node: TSESTree.TSMappedType): void {
        const source = context.sourceCode;
        const replacement = "text" in source ? interfaceText(node, source.text) : null;
        const alias = node.parent;
        context.report({
          node,
          messageId: "mappedType",
          suggest:
            replacement === null
              ? null
              : [
                  {
                    messageId: "writeInterface",
                    fix: (fixer: RuleTextEditor): RuleTextEdit =>
                      fixer.replaceText(alias, replacement),
                  },
                ],
        });
      },
    };
  },
};
