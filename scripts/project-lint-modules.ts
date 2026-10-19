/**
 * `project/no-asset-imports`, a repo-local rule of the `project` plugin in
 * `scripts/project-lint.ts`.
 *
 * @module
 */

import type { TSESTree } from "@typescript-eslint/types";

import type { ProjectRule } from "./project-lint-types.ts";

/** A module specifier read as a path: relative, absolute, or a `#` alias. */
const PATH_SPECIFIER_PATTERN: RegExp = /^[./#]/u;

/**
 * Module extensions that may be imported, matched as whole extensions: `.ts`,
 * and `.js`, `.mts`, `.mjs` for package subpaths.
 */
const MODULE_EXTENSIONS: ReadonlySet<string> = new Set([".ts", ".js", ".mts", ".mjs"]);

/**
 * Whether `source` names an asset rather than a `.ts`, `.js`, `.mts`, or
 * `.mjs` module: a query string such as `?raw`, or a final path segment with
 * any other extension.
 * Bare package names are left alone, dots and all, as are extensionless paths.
 */
function isAssetSource(source: string): boolean {
  if (source.includes("?")) {
    return true;
  }
  const segments: string[] = source.split("/");
  if (!PATH_SPECIFIER_PATTERN.test(source)) {
    const nameLength: number = source.startsWith("@") ? 2 : 1;
    if (segments.length <= nameLength) {
      return false;
    }
  }
  const lastSegment: string = segments.at(-1) ?? "";
  if (lastSegment === "." || lastSegment === ".." || !lastSegment.includes(".")) {
    return false;
  }
  const extension: string = lastSegment.slice(lastSegment.lastIndexOf("."));
  return !MODULE_EXTENSIONS.has(extension);
}

/**
 * `no-asset-imports` - rejects importing anything but a `.ts`, `.js`, `.mts`,
 * or `.mjs` module: a source path, static or a dynamic `import()` with a
 * string literal, ending in another extension (`.css`, `.json`, `.svg`,
 * `.jsx`, `.tsx`, `.cjs`) or carrying a query string (`?raw`, `?url`), and
 * any import or export with import attributes. `.js`, `.mts`, and `.mjs` are
 * for package subpaths such as `lit/decorators.js`; this repo's own files are
 * all `.ts`. Bare package
 * names, `#` aliases, and `node:` builtins without an extension pass.
 */
export const noAssetImportsRule: ProjectRule = {
  meta: {
    type: "problem",
    docs: { description: "Disallow importing CSS, JSON, SVG, and other assets" },
    schema: [],
    messages: {
      extension: "Only .ts, .js, .mts and .mjs modules may be imported.",
      attributes: "Import attributes are not allowed.",
    },
  },
  create(context) {
    function checkSource(source: TSESTree.StringLiteral): void {
      if (isAssetSource(source.value)) {
        context.report({ node: source, messageId: "extension" });
      }
    }
    function checkDeclaration(
      node:
        | TSESTree.ImportDeclaration
        | TSESTree.ExportNamedDeclaration
        | TSESTree.ExportAllDeclaration,
    ): void {
      if (node.source === null) {
        return;
      }
      checkSource(node.source);
      if (node.attributes.length > 0) {
        context.report({ node, messageId: "attributes" });
      }
    }
    return {
      ImportDeclaration: checkDeclaration,
      ExportNamedDeclaration: checkDeclaration,
      ExportAllDeclaration: checkDeclaration,
      ImportExpression(node: TSESTree.ImportExpression): void {
        if (node.source.type === "Literal" && typeof node.source.value === "string") {
          checkSource(node.source);
        }
        if (node.options !== null) {
          context.report({ node, messageId: "attributes" });
        }
      },
    };
  },
};
