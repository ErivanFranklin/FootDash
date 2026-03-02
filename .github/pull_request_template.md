## Description
<!-- Describe your changes in detail -->
<!-- Which issue does this PR fix? (e.g. Fixes #123) -->

## Type of Change
- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] ♻️ Refactor (no functional changes, code restructuring)
- [ ] 🏗️ Architecture / State Management

## State Management Migration Checklist
*(Only applicable if modifying global state / NgRx)*

- [ ] **State Shape:** Documented the new state interface and location.
- [ ] **Actions:** Used concise, intent-driven action types (e.g., `[Auth] Login Success`).
- [ ] **Immutability:** Reducers are pure functions; state is not mutated directly.
- [ ] **Effects:** Side effects (API calls, storage) are isolated in Effects.
- [ ] **Selectors:** Created memoized selectors for UI consumption.
- [ ] **Facade/Service:** Components interact via Facade/Service, not directly with `Store.dispatch`.
- [ ] **Cleanup:** Removed old local state or duplicate Service logic.

## Testing
- [ ] Unit tests added for Reducers (state transitions).
- [ ] Unit tests added for Selectors.
- [ ] Unit tests added for Effects (marble testing or observer spies).
- [ ] Application builds successfully (`npm run build`).

## Screenshots / Screen Recording
<!-- If applicable, add screenshots to show the UI changes or DevTools state -->

## Additional Notes
<!-- Any other information that is important to this PR such as deployment instructions -->

## Deployment / Rollout
- [ ] Feature flag or rollout plan included (if disruptive)
- [ ] Rollback steps documented

## Reviewers / Labels
- Suggested reviewers: @frontend-team, @backend-team
- Suggested labels: scope:state, type:chore, needs:qa
