'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
import { Send } from 'lucide-react';
import { ModuleChrome } from '../../components/ModuleChrome';
import LocationSelect from '../../components/LocationSelect';
import { LocationProvider } from '../../lib/location-context';
import { FiscalYearProvider } from '../../lib/fiscal-year-context';
import { CurrencyProvider } from '../../lib/currency-context';
import { ExportSidebar, EXPORT_SECTIONS } from './nav';

export default function ExportLayout({ children }: { children: React.ReactNode }) {
  const topGroups = EXPORT_SECTIONS.map((section) => ({
    label: section.label,
    items: section.items.map((item) => ({ label: item.label, href: item.href }))
  }));

  return (
    <FiscalYearProvider>
      <LocationProvider allowAll allowAllUsers>
        <CurrencyProvider>
          <ModuleChrome
            title="Export Management"
            icon={<Send className="w-5 h-5 text-[#014582]" />}
            sidebar={<ExportSidebar />}
            topGroups={topGroups}
            headerRightExtra={<LocationSelect entityLabel="Location" />}
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
