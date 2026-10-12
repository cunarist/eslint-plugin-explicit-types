---
description: Every rule has a .md beside it with exactly Why, Examples, Notes; README links, never repeats
---

Every rule gets a `.md` beside it with exactly these sections:

````markdown
# rule-name

One or two sentences. Start with "Rejects …" or "Requires …".

## Why

Prose. Not a restatement of the rule — the concrete failure it prevents, then
why the alternative removes that failure structurally.

## Examples

One ```ts block containing `// BAD` then `// GOOD`. Minimal code.

## Notes

Bullets covering the edges: what it deliberately does not fire on, what variants
it does catch, what it cannot see. These double as the test list.
````

`README.md` links to each of these and never repeats them; per preset it carries
one paragraph of philosophy, one representative BAD/GOOD, and a table of
`rule → what it catches`. No contributor-facing content — library users only.

`vp fmt` reformats Markdown, tables included. Keep ` ```ts ` examples valid at
top level; wrap a bare `readonly` or `private` modifier in a `class … { }` body.
