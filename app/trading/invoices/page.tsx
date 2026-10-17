'use client';

export const dynamic = 'force-dynamic';

import { SalesInvoicesPage } from '../../sales/invoices/page';
import { TradingEmbeddedPage } from '@/components/trade/TradingEmbeddedPage';

export default function TradingInvoicesPage() {
  return (
    <TradingEmbeddedPage title="Trading Sales Invoices" sharedFrom="Sales Invoices">
      <SalesInvoicesPage />
    </TradingEmbeddedPage>
  );
}
