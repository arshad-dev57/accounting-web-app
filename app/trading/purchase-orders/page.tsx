'use client';

export const dynamic = 'force-dynamic';

import PurchaseOrdersPage from '../../purchases/purchaseorder/page';
import { TradingEmbeddedPage } from '@/components/trade/TradingEmbeddedPage';

export default function TradingPurchaseOrdersPage() {
  return (
    <TradingEmbeddedPage title="Trading Purchase Orders" sharedFrom="Purchase Orders">
      <PurchaseOrdersPage />
    </TradingEmbeddedPage>
  );
}
