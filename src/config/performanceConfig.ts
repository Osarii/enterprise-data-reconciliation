/*
 * V0.1.8 performance thresholds are application-defined.
 * They are used only for workload labels and browser-storage
 * awareness; they are not presented as browser or industry limits.
 */
export const SMALL_DATASET_MAX_ROWS = 5_000;
export const MEDIUM_DATASET_MAX_ROWS = 20_000;

/*
 * Full workspace persistence is intentionally capped by the
 * application's own row-count policy. localStorage is synchronous,
 * so serializing and storing very large record arrays can both block
 * the UI and exceed the browser quota.
 *
 * At or below this combined ERP + CRM row count, the current workspace
 * can be persisted in full. Above it, the active datasets/result remain
 * in memory while compact history, mappings and rules are persisted.
 */
export const FULL_WORKSPACE_PERSISTENCE_MAX_ROWS = 20_000;

/*
 * localStorage quotas vary by browser and environment.
 * Five MiB is used only as a conservative reference point so the UI
 * can warn before the frontend workspace becomes uncomfortably large.
 */
export const WORKSPACE_STORAGE_REFERENCE_BYTES =
  5 * 1024 * 1024;

export const WORKSPACE_STORAGE_WARNING_RATIO = 0.7;
export const WORKSPACE_STORAGE_HIGH_RATIO = 0.9;
