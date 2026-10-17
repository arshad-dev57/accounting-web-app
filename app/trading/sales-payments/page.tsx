'use client';

export const dynamic = 'force-dynamic';

import { SalesPaymentsPage } from '../../sales/sales-payment/page';
import { TradingEmbeddedPage } from '@/components/trade/TradingEmbeddedPage';

export default function TradingSalesPaymentsPage() {
  return (
    <TradingEmbeddedPage title="Trading Sales Payments" sharedFrom="Sales Payments">
      <SalesPaymentsPage />
    </TradingEmbeddedPage>
  );
}
