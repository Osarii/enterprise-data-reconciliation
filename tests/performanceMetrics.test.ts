import { describe, expect, it } from 'vitest';

import {
  createDatasetProcessingMetrics,
  createReconciliationProcessingMetrics,
  formatDuration,
  getWorkloadTier,
} from '../src/utils/performanceMetrics';

describe('performanceMetrics', () => {
  it('classifies workloads using the application thresholds', () => {
    expect(getWorkloadTier(5_000)).toBe('Small');
    expect(getWorkloadTier(5_001)).toBe('Medium');
    expect(getWorkloadTier(20_000)).toBe('Medium');
    expect(getWorkloadTier(20_001)).toBe('Large');
  });

  it('calculates import processing metrics and throughput', () => {
    const metrics = createDatasetProcessingMetrics(10, 15, 1_000);

    expect(metrics.csvParseMs).toBe(10);
    expect(metrics.validationMs).toBe(15);
    expect(metrics.totalImportMs).toBe(25);
    expect(metrics.rowsProcessed).toBe(1_000);
    expect(metrics.rowsPerSecond).toBe(40_000);
    expect(metrics.workloadTier).toBe('Small');
  });

  it('calculates reconciliation processing metrics', () => {
    const metrics = createReconciliationProcessingMetrics(200, 50_000);

    expect(metrics.durationMs).toBe(200);
    expect(metrics.totalRowsProcessed).toBe(50_000);
    expect(metrics.throughputRowsPerSecond).toBe(250_000);
    expect(metrics.workloadTier).toBe('Large');
  });

  it('sanitizes negative processing durations', () => {
    expect(createReconciliationProcessingMetrics(-10, 100).durationMs).toBe(
      0
    );
  });

  it('formats durations for milliseconds and seconds', () => {
    expect(formatDuration(0.5)).toBe('0.50 ms');
    expect(formatDuration(125)).toBe('125.0 ms');
    expect(formatDuration(1_500)).toBe('1.50 s');
  });
});
