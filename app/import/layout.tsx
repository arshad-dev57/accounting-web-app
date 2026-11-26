'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
import { Ship } from 'lucide-react';
import { ModuleChrome } from '../../components/ModuleChrome';
import LocationSelect from '../../components/LocationSelect';
import { LocationProvider } from '../../lib/location-context';
import { FiscalYearProvider } from '../../lib/fiscal-year-context';
import { CurrencyProvider } from '../../lib/currency-context';
import { usePermissions } from '../../lib/usePermissions';
import { ImportSidebar, IMPORT_SECTIONS } from './nav';

export default function ImportLayout({ children }: { children: React.ReactNode }) {
  const { can, isAdmin } = usePermissions();
  const topGroups = IMPORT_SECTIONS.map((section) => ({
    label: section.label,
    items: section.items
      .filter((item) => !item.requirePermission || isAdmin || can(item.requirePermission))
      .map((item) => ({ label: item.label, href: item.href }))
  }));

  return (
    <FiscalYearProvider>
      <LocationProvider allowAll allowAllUsers>
        <CurrencyProvider>
          <ModuleChrome
            title="Import Management"
            icon={<Ship className="w-5 h-5 text-[#014582]" />}
            sidebar={<ImportSidebar />}
            topGroups={topGroups}
            headerRightExtra={<LocationSelect entityLabel="Warehouse" />}
            mainClassName="bg-[#f8fafc]"
            contentClassName="flex-1 p-4 sm:p-6 overflow-y-auto"
          >
            {children}
          </ModuleChrome>
        </CurrencyProvider>
      </LocationProvider>
    </FiscalYearProvider>
  );
}
