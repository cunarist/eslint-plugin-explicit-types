---
description: The rules come from memona's Deno lint plugin and coding standards, which win any conflict
---

Source of the rules: `../memona` — `user_app/scripts/deno-lint-plugin.ts` (the
`restricted-types` mega-rule plus several standalone rules) and the TypeScript
section of `.agents/memory/coding-standards.md`. That is the house style and it
wins on any conflict.

This package was the Deno plugin `jsr:@cunarist/deno-lint-plugin-explicit-types` (last at 0.5.1) until it was ported to ESLint and Oxlint; see [[one-plugin-presets-as-configs]].
