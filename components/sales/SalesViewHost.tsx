'use client';

import ModuleViewHost, {
  isModuleKeepAliveRoute,
  useModulePageVisible,
} from '../ModuleViewHost';
import {
  SALES_KEEP_ALIVE_ROUTES,
  salesViewHostConfig,
} from '../../lib/module-view-host/registries';

export { useModulePageVisible, useModulePageVisible as useSalesPageVisible };
export { SALES_KEEP_ALIVE_ROUTES };

export function isSalesKeepAliveRoute(pathname: string): boolean {
  return isModuleKeepAliveRoute(SALES_KEEP_ALIVE_ROUTES, pathname);
}

export default function SalesViewHost({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ModuleViewHost config={salesViewHostConfig}>{children}</ModuleViewHost>
  );
}
