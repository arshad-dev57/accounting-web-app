'use client';

export const dynamic = 'force-dynamic';

import { DeliveriesPage } from '../../sales/deliveries/page';
import { TradingEmbeddedPage } from '@/components/trade/TradingEmbeddedPage';

export default function TradingDeliveriesPage() {
  return (
    <TradingEmbeddedPage title="Trading Delivery & Dispatch" sharedFrom="Sales Deliveries">
      <DeliveriesPage />
    </TradingEmbeddedPage>
  );
}
