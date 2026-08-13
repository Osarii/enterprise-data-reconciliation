import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        url: 'http://localhost/',
      },
    },
    include: ['tests/**/*.test.ts'],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: 'node_modules/.cache/vitest-coverage',
      include: [
        'src/utils/normalizeData.ts',
        'src/utils/dataQuality.ts',
        'src/utils/fieldMapping.ts',
        'src/utils/reconciliationRules.ts',
        'src/utils/reconcileData.ts',
        'src/utils/reconciliationHistory.ts',
        'src/utils/performanceMetrics.ts',
        'src/utils/workspacePersistence.ts',
        'src/schemas/reconciliationSchema.ts',
      ],
      exclude: [
        'tests/**',
        'src/**/*.d.ts',
      ],
    },
  },
});
