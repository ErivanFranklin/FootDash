// ─── Root barrel for the store/ directory ──────────────────────────────────

// Classic NgRx — Auth
export * from './auth';
export * from './app.state';

// NgRx SignalStores
export { GamificationStore } from './gamification/gamification.store';
export { NotificationsStore } from './notifications/notifications.store';
export { BillingStore } from './billing/billing.store';
export { OfflineStore } from './offline/offline.store';
