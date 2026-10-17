'use client';

export const dynamic = 'force-dynamic';

import PurchaseRefundsPage from '../../purchases/refunds/page';
import { TradingEmbeddedPage } from '@/components/trade/TradingEmbeddedPage';

export default function TradingPurchaseRefundsPage() {
  return (
    <TradingEmbeddedPage title="Trading Purchase Refunds" sharedFrom="Purchase Refunds">
      <PurchaseRefundsPage />
    </TradingEmbeddedPage>
  );
}
