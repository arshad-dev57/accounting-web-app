'use client';

export const dynamic = 'force-dynamic';

import PurchaseReturnsPage from '../../purchases/returns/page';
import { TradingEmbeddedPage } from '@/components/trade/TradingEmbeddedPage';

export default function TradingPurchaseReturnsPage() {
  return (
    <TradingEmbeddedPage title="Trading Purchase Returns" sharedFrom="Purchase Returns">
      <PurchaseReturnsPage />
    </TradingEmbeddedPage>
  );
}
