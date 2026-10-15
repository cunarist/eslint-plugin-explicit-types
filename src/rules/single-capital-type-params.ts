import type { TSESTree } from "@typescript-eslint/types";

import { docsUrl, type ExplicitRule, renameFix } from "#helpers";

/** A type parameter name that is one capital letter and nothing else. */
const SINGLE_CAPITAL_PATTERN = /^[A-Z]$/u;

/** A `T`-prefixed name such as `TValue`, whose second letter is the meaningful one. */
const T_PREFIX_PATTERN = /^T[A-Z]/u;

/** The letters tried after the name's own initial, conventional ones first. */
const FALLBACK_LETTERS: string[] = [
  "T",
  "U",
  "V",
  "W",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "X",
  "Y",
  "Z",
];

/**
 * The single capitals a name could become, best first: its own initial, read
 * past a `T` prefix so `TValue` offers `V`, then the conventional `T`, `U`,
 * `V`, `W`, then the rest of the alphabet.
 */
function candidatesFor(name: string): string[] {
  const meaningful = T_PREFIX_PATTERN.test(name) ? name.slice(1) : name;
  const initial = meaningful.charAt(0).toUpperCase();
  const letters = SINGLE_CAPITAL_PATTERN.test(initial)
    ? [initial, ...FALLBACK_LETTERS]
    : FALLBACK_LETTERS;
  return [...new Set(letters)];
}

/**
 * `single-capital-type-params` — requires every type parameter to be named
 * with one capital letter, such as `T`, `K`, or `V`.
 *
 * A one-letter capital cannot be mistaken for a declared type: `Item` in
 * `function first<Item>(items: Item[]): Item` reads like an interface that
 * lives somewhere else, while `T` can only be a parameter. Several parameters
 * may use any distinct capitals, in any order.
 *
 * The rename is a suggestion rather than a fix: it changes the declaration a
 * reader sees, and merged interface declarations must agree on their type
 * parameter names. It is offered only when some capital is not yet used
 * anywhere in the text of the parameter's declaration.
 */
export const singleCapitalTypeParamsRule: ExplicitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Require type parameters to be named with a single capital letter",
      url: docsUrl("single-capital-type-params"),
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      notSingleCapital: "Type parameter '{{name}}' is not a single capital letter.",
      rename: "Rename `{{name}}` to `{{suggestion}}` within its declaration.",
    },
  },
  create(context) {
    /** Report a type parameter of `owner` whose name is not a single capital. */
    function check(parameter: TSESTree.TSTypeParameter, owner: TSESTree.Node): void {
      const identifier = parameter.name;
      if (SINGLE_CAPITAL_PATTERN.test(identifier.name)) {
        return;
      }
      for (const suggestion of candidatesFor(identifier.name)) {
        const rename = renameFix(context.sourceCode, identifier, suggestion, owner);
        if (rename !== null) {
          context.report({
            node: identifier,
            messageId: "notSingleCapital",
            data: { name: identifier.name },
            suggest: [
              {
                messageId: "rename",
                data: { name: identifier.name, suggestion },
                fix: rename.fix,
              },
            ],
          });
          return;
        }
      }
      context.report({
        node: identifier,
        messageId: "notSingleCapital",
        data: { name: identifier.name },
      });
    }

    return {
      TSTypeParameterDeclaration(node: TSESTree.TSTypeParameterDeclaration): void {
        for (const parameter of node.params) {
          check(parameter, node.parent);
        }
      },
    };
  },
};
