import type { RuleFixer, RuleTextEdit, SuggestedEdit } from "@eslint/core";
import type { TSESTree } from "@typescript-eslint/types";

import { docsUrl, type ExplicitRule, renameFix } from "#helpers";

/** Lowercase ASCII letter after a non-underscore and one underscore. */
const UNDERSCORE_CHAR_PATTERN = /([^_])_([a-z])/gu;

/** A lowercase ASCII first letter. */
const FIRST_CHAR_LOWERCASE_PATTERN = /^[a-z]/u;

/** A name `pascal-case-types` accepts for a type. */
const PASCAL_CASE_PATTERN = /^[A-Z][A-Za-z0-9]*$/u;

/** Leading and trailing underscores. */
const EDGE_UNDERSCORES_PATTERN = /^_+|_+$/gu;

/** Declarations whose `declare` modifier makes the whole subtree ambient. */
const AMBIENT_TYPES: string[] = [
  "ClassDeclaration",
  "TSDeclareFunction",
  "VariableDeclaration",
  "TSTypeAliasDeclaration",
  "TSInterfaceDeclaration",
  "TSModuleDeclaration",
  "TSEnumDeclaration",
];

/** Source ending in `(`, then only whitespace and comments. */
const PARENTHESIZED_TAIL_PATTERN = /\((?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*)*$/u;

/** Nodes a destructuring pattern can sit in before reaching its owner. */
const PATTERN_TYPES: string[] = [
  "ArrayPattern",
  "ObjectPattern",
  "AssignmentPattern",
  "Property",
  "RestElement",
];

/** ASCII-only uppercase, as Deno's `to_ascii_uppercase`. */
function asciiUpper(text: string): string {
  return text.replaceAll(/[a-z]/gu, (char) => char.toUpperCase());
}

/** Whether a name has an underscore, ignoring leading and trailing ones, and is not ALL_UPPER. */
export function isUnderscored(name: string): boolean {
  const trimmed = name.replace(EDGE_UNDERSCORES_PATTERN, "");
  return trimmed.includes("_") && trimmed !== asciiUpper(trimmed);
}

/** Deno's suggested camelCase spelling; an UPPER_SNAKE spelling if no letter follows `_`. */
export function toCamelCase(name: string): string {
  if (!isUnderscored(name)) {
    return name;
  }
  const result = name.replace(
    UNDERSCORE_CHAR_PATTERN,
    (_match: string, before: string, letter: string) => `${before}${letter.toUpperCase()}`,
  );
  if (result !== name) {
    return result;
  }
  return asciiUpper(name);
}

/** Deno's suggested PascalCase spelling, for type-like names. */
function toPascalCase(name: string): string {
  return toCamelCase(name).replace(FIRST_CHAR_LOWERCASE_PATTERN, (char) => char.toUpperCase());
}

/** Whether a declaration with a `declare` modifier encloses the node. */
function isAmbient(node: TSESTree.Node): boolean {
  let current: TSESTree.Node | null = node;
  while (current !== null) {
    if (AMBIENT_TYPES.includes(current.type) && "declare" in current && current.declare) {
      return true;
    }
    current = current.parent ?? null;
  }
  return false;
}

/** Whether a destructuring pattern belongs to a variable declarator rather than a parameter. */
function inVarDeclarator(pattern: TSESTree.Node): boolean {
  let current = pattern.parent ?? null;
  while (current !== null && PATTERN_TYPES.includes(current.type)) {
    current = current.parent ?? null;
  }
  return current !== null && current.type === "VariableDeclarator";
}

/** Whether a function is the default export, which Deno treats as an expression. */
function isDefaultExport(node: TSESTree.Node): boolean {
  return node.parent?.type === "ExportDefaultDeclaration";
}

/** What a report offers to change: a fix, suggestions, or neither. */
interface Remedy {
  fix?: RuleFixer;
  suggest: SuggestedEdit[];
}

/** A report that offers no change. */
const NO_REMEDY: Remedy = { suggest: [] };

/** The suggestion to quote a key as `replacement`, which leaves the object's shape alone. */
function quoteSuggestions(identifier: TSESTree.Identifier, replacement: string): Remedy {
  return {
    suggest: [
      {
        messageId: "quoteKey",
        data: { name: identifier.name },
        fix: (fixer): RuleTextEdit => fixer.replaceText(identifier, replacement),
      },
    ],
  };
}

/**
 * `camelcase` — Deno's built-in `camelcase` rule: names this code declares are
 * camelCase, PascalCase, or UPPER_SNAKE_CASE, never snake_case.
 *
 * A port of `deno_lint`'s `src/rules/camelcase.rs`, reporting the same
 * identifiers with ESLint's `camelcase` message.
 *
 * A declared name private to this file is renamed, with its uses, by a fix;
 * one other files may see, being exported or global, gets the rename as a
 * suggestion. An object or type key gets a suggestion quoting it, which keeps
 * the shape: other files may read the key.
 */
export const camelcaseRule: ExplicitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Enforce camelCase, PascalCase, or UPPER_SNAKE_CASE for declared names",
      url: docsUrl("camelcase"),
    },
    fixable: "code",
    hasSuggestions: true,
    schema: [],
    messages: {
      notCamelCase: "Identifier '{{name}}' is not in camel case.",
      renameTo: "Rename `{{name}}` to `{{suggestion}}` throughout this file.",
      quoteKey: 'Quote the key as `"{{name}}"`.',
    },
  },
  create(context) {
    /** Identifiers already judged, keyed by range, as Deno dedupes them. */
    const visited = new Set<string>();

    /**
     * The rename of a declared name and its uses, if one is safe: a fix when
     * the name is private to this file, a suggestion when others may see it.
     * A camelCase name for a type `pascal-case-types` would reject is never a
     * fix either.
     */
    function renameRemedy(identifier: TSESTree.Identifier, suggestion: string): Remedy {
      const rename = renameFix(context.sourceCode, identifier, suggestion);
      if (rename === null) {
        return NO_REMEDY;
      }
      if (rename.private && (!rename.namesType || PASCAL_CASE_PATTERN.test(suggestion))) {
        return { fix: rename.fix, suggest: [] };
      }
      return {
        suggest: [
          { messageId: "renameTo", data: { name: identifier.name, suggestion }, fix: rename.fix },
        ],
      };
    }

    /**
     * Report an identifier once, unless it is ambient or acceptably cased.
     * `remedy` builds the report's fix and suggestions from the camelCase or
     * PascalCase `suggestion`.
     */
    function check(
      identifier: TSESTree.Identifier,
      suggestion: string,
      remedy: (identifier: TSESTree.Identifier, suggestion: string) => Remedy,
    ): void {
      const key = `${identifier.range[0]}:${identifier.name}`;
      if (visited.has(key)) {
        return;
      }
      visited.add(key);
      if (!isUnderscored(identifier.name) || isAmbient(identifier)) {
        return;
      }
      // typescript-eslint's identifier spans its `?` and type annotation, so
      // the report is trimmed to the name, as ESLint's own parser reports it.
      const start = identifier.loc.start;
      context.report({
        node: identifier,
        loc: {
          start,
          end: { line: start.line, column: start.column + identifier.name.length },
        },
        messageId: "notCamelCase",
        data: { name: identifier.name },
        ...remedy(identifier, suggestion),
      });
    }

    /** A value or function name, suggested in camelCase. */
    function checkValue(identifier: TSESTree.Identifier): void {
      check(identifier, toCamelCase(identifier.name), renameRemedy);
    }

    /**
     * A type-like name, suggested in PascalCase. The rename is offered only
     * when `pascal-case-types` would accept it.
     */
    function checkTypeLike(identifier: TSESTree.Identifier): void {
      check(identifier, toPascalCase(identifier.name), (target, suggestion) =>
        PASCAL_CASE_PATTERN.test(suggestion) ? renameRemedy(target, suggestion) : NO_REMEDY,
      );
    }

    /** An enum member, which a rename cannot follow through `Enum.member` uses. */
    function checkEnumMember(identifier: TSESTree.Identifier): void {
      check(identifier, toPascalCase(identifier.name), () => NO_REMEDY);
    }

    /**
     * An unquoted object or type member key. Quoting a computed key, `[a_b]`,
     * would turn a reference into a string, so that gets no suggestion.
     */
    function checkKey(identifier: TSESTree.Identifier, computed: boolean): void {
      check(identifier, toCamelCase(identifier.name), (target) =>
        computed ? NO_REMEDY : quoteSuggestions(target, `"${target.name}"`),
      );
    }

    /** Every name a binding pattern declares. */
    function checkPattern(pattern: TSESTree.Node | null): void {
      if (pattern === null) {
        return;
      }
      switch (pattern.type) {
        case "Identifier":
          checkValue(pattern);
          return;
        case "ArrayPattern":
          for (const element of pattern.elements) {
            checkPattern(element);
          }
          return;
        case "RestElement":
          checkPattern(pattern.argument);
          return;
        case "AssignmentPattern":
          checkPattern(pattern.left);
          return;
        case "ObjectPattern":
          for (const property of pattern.properties) {
            checkPatternProperty(pattern, property);
          }
          break;
        default:
          break;
      }
    }

    /**
     * One member of an object pattern. A shorthand `{ snake_key }` mirrors a
     * key the code does not own, so it is skipped in a variable declarator.
     */
    function checkPatternProperty(
      pattern: TSESTree.ObjectPattern,
      property: TSESTree.ObjectPattern["properties"][number],
    ): void {
      if (property.type === "RestElement") {
        checkPattern(property.argument);
        return;
      }
      if (property.shorthand) {
        if (!inVarDeclarator(pattern) && property.key.type === "Identifier") {
          checkValue(property.key);
        }
        return;
      }
      const value = property.value;
      if (value.type === "AssignmentPattern" && value.left.type === "Identifier") {
        checkValue(value.left);
        return;
      }
      checkPattern(value);
    }

    /** The parameters of a function, skipping constructor parameter properties. */
    function checkParams(params: TSESTree.Parameter[]): void {
      for (const param of params) {
        if (param.type !== "TSParameterProperty") {
          checkPattern(param);
        }
      }
    }

    /** Members of an interface or type literal, recursing into type-literal annotations. */
    function checkTypeElement(element: TSESTree.TypeElement): void {
      if (element.type === "TSPropertySignature") {
        if (element.key.type === "Identifier") {
          checkKey(element.key, element.computed);
        }
        checkType(element.typeAnnotation?.typeAnnotation ?? null);
        return;
      }
      if (element.type === "TSMethodSignature") {
        if (element.key.type === "Identifier") {
          checkValue(element.key);
        }
        if (element.kind !== "set") {
          checkType(element.returnType?.typeAnnotation ?? null);
        }
      }
    }

    /** A type, when it is a type literal. */
    function checkType(type: TSESTree.TypeNode | null): void {
      if (type !== null && type.type === "TSTypeLiteral") {
        for (const member of type.members) {
          checkTypeElement(member);
        }
      }
    }

    /** Every identifier of a namespace name, e.g. both of `a_b.c_d`. */
    function checkNamespaceName(name: TSESTree.EntityName): void {
      if (name.type === "Identifier") {
        checkTypeLike(name);
      } else if (name.type === "TSQualifiedName") {
        checkNamespaceName(name.left);
        checkTypeLike(name.right);
      }
    }

    /** The keys of an object literal a variable is initialized with. */
    function checkObjectKeys(object: TSESTree.ObjectExpression): void {
      for (const property of object.properties) {
        if (property.type !== "Property" || property.computed) {
          continue;
        }
        if (property.key.type !== "Identifier") {
          continue;
        }
        if (property.shorthand) {
          check(property.key, toCamelCase(property.key.name), (target) =>
            quoteSuggestions(target, `"${target.name}": ${target.name}`),
          );
        } else {
          checkKey(property.key, false);
        }
      }
    }

    /** Whether an expression is wrapped in parentheses, which Deno's AST keeps as a node. */
    function isParenthesized(node: TSESTree.Node): boolean {
      const source = context.sourceCode;
      if (!("text" in source)) {
        return false;
      }
      const text = source.text;
      let index = node.range[0] - 1;
      while (index >= 0 && /\s/u.test(text.charAt(index))) {
        index -= 1;
      }
      const previous = text.charAt(index);
      if (previous === "(") {
        return true;
      }
      // Anything else but a comment's last character rules parentheses out.
      if (previous === "=" || previous === "") {
        return false;
      }
      return PARENTHESIZED_TAIL_PATTERN.test(text.slice(0, index + 1));
    }

    /** What a variable is initialized with, unless parenthesized, as Deno sees it. */
    function checkInit(init: TSESTree.Expression): void {
      if (isParenthesized(init)) {
        return;
      }
      if (init.type === "ObjectExpression") {
        checkObjectKeys(init);
      } else if (init.type === "FunctionExpression" && init.id !== null) {
        checkValue(init.id);
      } else if (init.type === "ClassExpression" && init.id !== null) {
        checkTypeLike(init.id);
      }
    }

    /** A function's own parameters; an object-literal setter's are skipped, as Deno does. */
    function checkFunctionExpression(
      node: TSESTree.FunctionExpression | TSESTree.TSEmptyBodyFunctionExpression,
    ): void {
      const parent = node.parent;
      if (parent.type === "Property" && parent.kind === "set") {
        return;
      }
      checkParams(node.params);
    }

    return {
      FunctionDeclaration(node: TSESTree.FunctionDeclaration): void {
        if (node.id !== null && !isDefaultExport(node)) {
          checkValue(node.id);
        }
        checkParams(node.params);
      },
      TSDeclareFunction(node: TSESTree.TSDeclareFunction): void {
        if (node.id !== null && !isDefaultExport(node)) {
          checkValue(node.id);
        }
        checkParams(node.params);
      },
      FunctionExpression: checkFunctionExpression,
      TSEmptyBodyFunctionExpression: checkFunctionExpression,
      ClassDeclaration(node: TSESTree.ClassDeclaration): void {
        if (node.id !== null && !isDefaultExport(node)) {
          checkTypeLike(node.id);
        }
      },
      VariableDeclaration(node: TSESTree.VariableDeclaration): void {
        for (const declarator of node.declarations) {
          checkPattern(declarator.id);
          if (declarator.init !== null) {
            checkInit(declarator.init);
          }
        }
      },
      ImportSpecifier(node: TSESTree.ImportSpecifier): void {
        if (node.imported.range[0] !== node.local.range[0]) {
          checkValue(node.local);
        }
      },
      ImportDefaultSpecifier(node: TSESTree.ImportDefaultSpecifier): void {
        checkValue(node.local);
      },
      ImportNamespaceSpecifier(node: TSESTree.ImportNamespaceSpecifier): void {
        checkValue(node.local);
      },
      ExportAllDeclaration(node: TSESTree.ExportAllDeclaration): void {
        if (node.exported !== null && node.exported.type === "Identifier") {
          checkValue(node.exported);
        }
      },
      TSTypeAliasDeclaration(node: TSESTree.TSTypeAliasDeclaration): void {
        checkTypeLike(node.id);
        checkType(node.typeAnnotation);
      },
      TSInterfaceDeclaration(node: TSESTree.TSInterfaceDeclaration): void {
        checkTypeLike(node.id);
        for (const element of node.body.body) {
          checkTypeElement(element);
        }
      },
      TSModuleDeclaration(node: TSESTree.TSModuleDeclaration): void {
        if (node.kind !== "global" && node.id.type !== "Literal") {
          checkNamespaceName(node.id);
        }
      },
      TSEnumDeclaration(node: TSESTree.TSEnumDeclaration): void {
        checkTypeLike(node.id);
        for (const member of node.body.members) {
          if (member.id.type === "Identifier") {
            checkEnumMember(member.id);
          }
        }
      },
    };
  },
};
