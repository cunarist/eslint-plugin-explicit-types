---
description: Template literal types, unannotated exported consts, and unannotated class fields are left alone on purpose
---

Checked against a real `deno lint` run before the port; each is a decision, not an oversight.

- **Template literal types** — `` type Path = `FILE_${Token}` ``. Same defect as
  a mapped type: the reader has to expand it. Left out because it shows up
  almost entirely in library `.d.ts` files rather than app code, and the common
  `` `on${Capitalize<K>}` `` form already trips `no-utility-types`.
- **An exported const with no annotation** — `export const d = { retries: 3 }`.
  Note that Deno's `no-slow-types` does **not** cover this: verified that it
  needs `name`/`exports` in `deno.json` to run at all, and even then it reports
  only missing return types, not object literals. So this really is uncovered —
  it is skipped for noise, not because something else catches it.
- **A class field with no annotation** — `class E { retries = 3 }`. Rust, the
  usual comparison, does require struct field types; it infers _local
  variables_. But a field initialiser is normally one obvious line, so the "read
  the whole body" argument behind `require-return-type` does not carry over.

Confirmed closed, for the record: angle-bracket assertions, `typeof import(…)`,
and the `as const` object used as a fake enum (`typeof F[keyof typeof F]` trips
`no-typeof-type` and `no-keyof`).
