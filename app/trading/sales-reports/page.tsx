'use client';

export const dynamic = 'force-dynamic';

import { SalesReportsPage } from '../../sales/reports/page';
import { TradingEmbeddedPage } from '@/components/trade/TradingEmbeddedPage';

export default function TradingSalesReportsPage() {
  return (
    <TradingEmbeddedPage title="Trading Sales Reports" sharedFrom="Sales Reports">
      <SalesReportsPage />
    </TradingEmbeddedPage>
  );
}
