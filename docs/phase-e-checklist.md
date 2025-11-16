```markdown
# Phase E — Cleanup & Enhancements

This document contains low-risk, high-value cleanup and enhancement tasks to finish Phase 1 of the FootDash migration. These are intended to be small, reviewable changes that tidy the repo and improve developer experience.

## Goals
- Remove accidental cruft and finalise documentation.
- Fix non-blocking CI warnings and prepare the codebase for further feature work.
- Add small, low-risk improvements (shared components, lazy-loading hints, README updates).

## Checklist (suggested order)

1. Update root and package READMEs
   - Add short `Phase E` summary and link to this checklist.
   - Document new local dev steps if any file paths changed.

2. Audit and remove deprecated files (manual review)
   - Confirm `archive/backend-legacy/` should be preserved (do not delete)
   - Remove any leftover `backend-nest` references (done earlier) and any other stale files not needed.

3. Sass migration (low-risk first pass)
   - Replace `@import` uses with `@use` where practical for our token files (e.g. `@use 'src/theme/_tokens' as tokens;`).
   - Validate Ionic/Angular pipeline; commit changes incrementally.

4. CI warnings
   - Triage remaining warnings (Sass deprecation, Stencil empty-glob) and either fix or add notes in `docs/` describing why they're safe.

5. Shared components & UI consistent small improvements
   - Expand `shared/components` (header, stat cards) as separate PRs.

6. Lazy loading & route optimisation
   - Add notes or small adjustments to prefer lazy-loaded feature routes where it helps time-to-interactive.

7. Final docs and lessons learned
   - Add an entry to `docs/` summarising what was done and any gotchas for future maintainers.

## Acceptance
- A PR (or small set of PRs) that completes items above with tests/lint passing and CI green.

---

If you'd like, I can start with item #1 (README updates + link to this checklist) and open a PR for review. Which item should I pick first?

```
