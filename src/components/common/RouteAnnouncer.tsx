import { useEffect, useMemo } from 'react';

import { useLocation } from 'react-router-dom';

import { getNavigationItem } from '../../config/navigationConfig';

const PRODUCT_NAME = 'Enterprise Data Reconciliation';

export default function RouteAnnouncer() {
  const location = useLocation();

  const pageLabel = useMemo(() => {
    const item = getNavigationItem(location.pathname);

    return item?.label ?? 'Page Not Found';
  }, [location.pathname]);

  useEffect(() => {
    document.title = `${pageLabel} | ${PRODUCT_NAME}`;
  }, [pageLabel]);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {`${pageLabel} page loaded`}
    </div>
  );
}
