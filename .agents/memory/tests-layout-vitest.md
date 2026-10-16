---
description: Vitest via vp test; unit tests sit next to code as *.test.ts, regression/integration tests in tests/ via the public entry; scripts/ has no tests
---

Decided 2026-10-14 for all repos.

- **Runner:** Vitest through `vp test`. Import test APIs from
  `vite-plus/test` (`describe`, `expect`, `it`).
- **Unit tests** sit next to the code: `src/foo/bar.ts` is tested in
  `src/foo/bar.test.ts`. Vitest's default include finds them; no `test`
  config needed. Packages publish only `dist/`, so colocated tests cost nothing
  in the tarball.
- **Regression and integration tests** live in the top-level `tests/` folder
  and import code only through `#` aliases (the plugin as `#plugin`, the
  same file `vp pack` builds), never `../` paths. No overrides for `tests/`. `vp test tests` runs just these.
- **No in-source tests** (`import.meta.vitest`).
- **`scripts/` gets no tests** (2026-10-15): it is repo tooling, not
  production code (`project-lint*.ts`).
- Test files follow every lint rule; no relaxed overrides for tests.

Tests must pass locally before any push.
