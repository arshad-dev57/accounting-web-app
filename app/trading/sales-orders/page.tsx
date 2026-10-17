'use client';

export const dynamic = 'force-dynamic';

import { SalesOrdersPage } from '../../sales/orders/page';
import { TradingEmbeddedPage } from '@/components/trade/TradingEmbeddedPage';

export default function TradingSalesOrdersPage() {
  return (
    <TradingEmbeddedPage title="Trading Sales Orders" sharedFrom="Sales Orders">
      <SalesOrdersPage />
    </TradingEmbeddedPage>
  );
}
