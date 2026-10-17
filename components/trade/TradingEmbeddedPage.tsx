'use client';

import { ErpModuleProvider, ModulePageChrome } from '@/lib/erp-module-context';

/** Renders a shared Sales/Purchase/Inventory page under Trading naming. */
export function TradingEmbeddedPage({
  title,
  sharedFrom,
  children,
}: {
  title: string;
  sharedFrom: string;
  children: React.ReactNode;
}) {
  return (
    <ErpModuleProvider module="trading" pageTitle={title}>
      <ModulePageChrome title={title} sharedFrom={sharedFrom}>
        {children}
      </ModulePageChrome>
    </ErpModuleProvider>
  );
}
