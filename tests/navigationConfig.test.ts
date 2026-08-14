import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  NAVIGATION_ITEMS,
  getNavigationItem,
  searchNavigation,
} from '../src/config/navigationConfig';

describe('navigationConfig', () => {
  it('defines unique routes for every workspace page', () => {
    const paths = NAVIGATION_ITEMS.map((item) => item.path);

    expect(new Set(paths).size).toBe(paths.length);
  });

  it('resolves known routes and returns null for unknown routes', () => {
    expect(getNavigationItem('/reports')?.label).toBe('Reports');
    expect(getNavigationItem('/does-not-exist')).toBeNull();
  });

  it('searches labels, descriptions and workflow keywords', () => {
    expect(searchNavigation('pdf').map((item) => item.label)).toContain('Reports');
    expect(searchNavigation('tolerance').map((item) => item.label)).toContain('Reconciliation');
    expect(searchNavigation('storage').map((item) => item.label)).toContain('Settings');
  });

  it('returns all navigation items for an empty query', () => {
    expect(searchNavigation('')).toHaveLength(NAVIGATION_ITEMS.length);
  });
});
