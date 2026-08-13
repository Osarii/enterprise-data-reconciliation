/*
 * The localStorage key intentionally remains on v1 so that
 * earlier V0.1.x browser workspaces can be migrated in place
 * instead of being silently abandoned under a different key.
 */
export const WORKSPACE_STORAGE_KEY =
  'enterprise-data-reconciliation.workspace.v1';

export const WORKSPACE_STORAGE_VERSION = 6 as const;

export const RECONCILIATION_HISTORY_LIMIT = 20;

export const THEME_MODE_STORAGE_KEY =
  'enterprise-data-reconciliation.theme-mode';
