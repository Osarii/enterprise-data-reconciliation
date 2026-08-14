export type NavigationIconKey =
  | 'dashboard'
  | 'imports'
  | 'reconciliation'
  | 'exceptions'
  | 'reports'
  | 'history'
  | 'settings';

export interface NavigationItem {
  label: string;
  path: string;
  description: string;
  keywords: string[];
  iconKey: NavigationIconKey;
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    label: 'Dashboard',
    path: '/',
    description: 'Executive reconciliation overview and current workspace metrics.',
    keywords: ['home', 'overview', 'metrics', 'summary'],
    iconKey: 'dashboard',
  },
  {
    label: 'Imports',
    path: '/imports',
    description: 'Import, map, validate and assess ERP and CRM datasets.',
    keywords: ['csv', 'upload', 'erp', 'crm', 'quality', 'mapping'],
    iconKey: 'imports',
  },
  {
    label: 'Reconciliation',
    path: '/reconciliation',
    description: 'Run matching rules and inspect exact, normalized and tolerance matches.',
    keywords: ['match', 'compare', 'worker', 'rules', 'tolerance'],
    iconKey: 'reconciliation',
  },
  {
    label: 'Exceptions',
    path: '/exceptions',
    description: 'Review differences and records found in only one source system.',
    keywords: ['difference', 'review', 'pending', 'only erp', 'only crm'],
    iconKey: 'exceptions',
  },
  {
    label: 'Reports',
    path: '/reports',
    description: 'Analyze KPIs, charts and exportable reconciliation reports.',
    keywords: ['pdf', 'csv', 'charts', 'analytics', 'kpi'],
    iconKey: 'reports',
  },
  {
    label: 'History',
    path: '/history',
    description: 'Inspect retained reconciliation runs, trends and audit context.',
    keywords: ['runs', 'audit', 'trend', 'performance', 'timeline'],
    iconKey: 'history',
  },
  {
    label: 'Settings',
    path: '/settings',
    description: 'Manage appearance, mappings, reconciliation rules and persistence.',
    keywords: ['configuration', 'dark mode', 'storage', 'rules', 'mapping'],
    iconKey: 'settings',
  },
];

export function getNavigationItem(pathname: string) {
  return NAVIGATION_ITEMS.find((item) => item.path === pathname) ?? null;
}

export function searchNavigation(query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return NAVIGATION_ITEMS;
  }

  return NAVIGATION_ITEMS.filter((item) => {
    const searchableText = [
      item.label,
      item.description,
      ...item.keywords,
    ]
      .join(' ')
      .toLowerCase();

    return searchableText.includes(normalizedQuery);
  });
}
