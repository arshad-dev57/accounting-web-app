'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { ModuleChrome } from '../../components/ModuleChrome';
import LocationSelect from '../../components/LocationSelect';
import { LocationProvider } from '../../lib/location-context';
import { FiscalYearProvider } from '../../lib/fiscal-year-context';
import { CurrencyProvider } from '../../lib/currency-context';
import { TradingSidebar, TRADING_SECTIONS } from './nav';

export default function TradingLayout({ children }: { children: React.ReactNode }) {
  const topGroups = TRADING_SECTIONS.map((section) => ({
    label: section.label.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    items: section.items.map((item) => ({ label: item.label, href: item.href }))
  }));

  return (
    <FiscalYearProvider>
      <LocationProvider allowAll allowAllUsers>
        <CurrencyProvider>
          <ModuleChrome
            title="Trading Management"
            icon={<ArrowLeftRight className="w-5 h-5 text-[#014582]" />}
            sidebar={<TradingSidebar />}
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
