/** Where a rule's `.md` lives, so `meta.docs.url` links to the source of truth. */
const DOCS_BASE = "https://github.com/cunarist/eslint-plugin-explicit-types/blob/main/src";

/** The documentation URL of a rule, e.g. `concrete/no-keyof`. */
export function docsUrl(preset: string, rule: string): string {
  return `${DOCS_BASE}/${preset}/${rule}.md`;
}
