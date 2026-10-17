'use client';

export const dynamic = 'force-dynamic';

import { SalesOrdersPage } from '../../sales/orders/page';
import { TradingEmbeddedPage } from '@/components/trade/TradingEmbeddedPage';

export default function TradingCustomerOrdersPage() {
  return (
    <TradingEmbeddedPage title="Trading Customer Orders" sharedFrom="Sales Orders">
      <SalesOrdersPage />
    </TradingEmbeddedPage>
  );
}
