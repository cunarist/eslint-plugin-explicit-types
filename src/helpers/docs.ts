/** Where a rule's `.md` lives, so `meta.docs.url` links to the source of truth. */
const DOCS_BASE = "https://github.com/cunarist/eslint-plugin-explicit-types/blob/main/docs/rules";

/** The documentation URL of a rule, e.g. `no-keyof`. */
export function docsUrl(rule: string): string {
  return `${DOCS_BASE}/${rule}.md`;
}
