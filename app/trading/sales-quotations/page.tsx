'use client';

export const dynamic = 'force-dynamic';

import { QuotationsPage } from '../../sales/quotations/page';
import { TradingEmbeddedPage } from '@/components/trade/TradingEmbeddedPage';

export default function TradingSalesQuotationsPage() {
  return (
    <TradingEmbeddedPage title="Trading Sales Quotations" sharedFrom="Sales Quotations">
      <QuotationsPage />
    </TradingEmbeddedPage>
  );
}
