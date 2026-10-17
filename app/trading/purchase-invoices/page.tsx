'use client';

export const dynamic = 'force-dynamic';

import PurchaseInvoicesPage from '../../purchases/invoices/page';
import { TradingEmbeddedPage } from '@/components/trade/TradingEmbeddedPage';

export default function TradingPurchaseInvoicesPage() {
  return (
    <TradingEmbeddedPage title="Trading Purchase Invoices" sharedFrom="Purchase Invoices">
      <PurchaseInvoicesPage />
    </TradingEmbeddedPage>
  );
}
