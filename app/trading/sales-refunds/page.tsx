'use client';

export const dynamic = 'force-dynamic';

import { SalesRefundsPage } from '../../sales/refunds/page';
import { TradingEmbeddedPage } from '@/components/trade/TradingEmbeddedPage';

export default function TradingSalesRefundsPage() {
  return (
    <TradingEmbeddedPage title="Trading Sales Refunds" sharedFrom="Sales Refunds">
      <SalesRefundsPage />
    </TradingEmbeddedPage>
  );
}
