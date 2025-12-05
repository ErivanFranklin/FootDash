# Phase E — Lessons Learned

This document captures practical lessons and recommendations uncovered during Phase E (Cleanup & Enhancements).

## Key Lessons

### Database & Backend

- **Async persistence matters**: Always await database writes when subsequent logic depends on the saved entity. The race condition in `AuthService.createTokens()` caused subtle e2e failures in Postgres but not in SQLite unit tests.

- **Migrations over sync**: Rely on TypeORM migrations for schema changes in CI/production. Turn off `synchronize` in runtime configs to avoid accidental schema changes.

- **Column naming consistency**: Prefer database naming conventions (snake_case). Use `@Column({ name: 'snake_case' })` in entities to map to existing schemas when migrating from legacy DBs.

- **E2E parity**: Ensure e2e tests run against the same environment as the app (global pipes, validation). Missing `ValidationPipe` caused request payload transformation differences.

### Frontend & Development Experience

- **Proxy & dev server mismatches**: Angular dev server proxy (`proxy.conf.json`) must point to actual backend port. Keep README examples updated.

- **Sass modernization**: Use `@use` and `@forward` instead of deprecated `@import`. Modern Sass module system provides better namespacing and avoids global pollution.

- **Component architecture**: Standalone components + lazy loading = smaller bundles and better tree-shaking. Combined with `PreloadAllModules`, this gives optimal UX.

- **Async UI patterns**: Components should handle async operations (Promises/Observables) automatically with loading states. Users expect immediate visual feedback.

- **Accessibility first**: Add ARIA labels and live regions from the start. Testing with screen readers should be part of component development, not an afterthought.

### CI & Tooling

- **CI etiquette**: Prefer LTS Node versions in workflows and create an `.nvmrc` to standardize local development.

- **Upstream warnings**: Not all warnings are actionable. Document upstream tool warnings (Stencil empty-glob) and why they're safe.

- **Test environment**: Headless Chrome requires explicit binary path in CI. Consider Puppeteer for consistent test execution across environments.

## Recommendations

### Immediate Actions

1. **Pre-merge checklist for migrations**: Ensure migration files are committed, run `migrate:show`, and avoid runtime `synchronize`.

2. **PR template**: Add template that reminds authors to update README and `MIGRATIONS.md` when adding migrations.

3. **Integration test**: Add small CI test that runs `npm run migrate:show` to ensure migrations are available and runnable.

4. **Migration debugging docs**: Add section to `backend/README.md` on how to debug migration issues and backfill missing fields safely.

### Component Library

5. **Shared components expansion**: ✅ StatCard and PageHeader implemented with async support and accessibility features.

6. **Component documentation**: ✅ Added `frontend/src/app/shared/README.md` documenting usage patterns.

7. **Unit test coverage**: ✅ Comprehensive tests for shared components including async handlers and accessibility.

### Performance

8. **Bundle analysis**: Set up periodic bundle analysis in CI to catch size regressions early.

9. **HTTP caching**: Implement HTTP interceptor for caching GET requests to reduce network calls.

10. **PWA consideration**: Evaluate Progressive Web App features for offline support and improved mobile experience.

## Completed Phase E Tasks

- ✅ Updated root and package READMEs with Phase E summary
- ✅ Audited and removed deprecated files (Express CI job, stale references)
- ✅ Sass migration completed (`@use`/`@forward` pattern)
- ✅ CI warnings triaged and documented
- ✅ Shared components enhanced:
  - StatCardComponent with subtitle, accessibility, and unit tests
  - PageHeaderComponent with async handler support and comprehensive tests
- ✅ Lazy loading verified and documented
- ✅ Performance optimization guide created
- ✅ Lessons learned documented

## Impact Summary

**Before Phase E:**
- Mixed documentation quality
- Deprecated code and CI jobs present
- Legacy Sass imports
- Basic shared components without tests
- Undocumented performance optimizations

**After Phase E:**
- Comprehensive, up-to-date documentation
- Clean codebase with deprecated items removed
- Modern Sass module system
- Robust, tested, accessible shared components
- Documented performance strategy with optimization guide

## Next Steps

- Create `.github/PULL_REQUEST_TEMPLATE.md` with migration checklist
- Add bundle size tracking to CI
- Consider implementing PWA features
- Expand shared component library as needed
- Add HTTP caching interceptor for improved performance
