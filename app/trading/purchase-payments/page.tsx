'use client';

export const dynamic = 'force-dynamic';

import PurchasePaymentsPage from '../../purchases/payments/page';
import { TradingEmbeddedPage } from '@/components/trade/TradingEmbeddedPage';

export default function TradingPurchasePaymentsPage() {
  return (
    <TradingEmbeddedPage title="Trading Purchase Payments" sharedFrom="Purchase Payments">
      <PurchasePaymentsPage />
    </TradingEmbeddedPage>
  );
}
