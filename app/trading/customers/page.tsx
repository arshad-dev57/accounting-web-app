'use client';

export const dynamic = 'force-dynamic';

import SalesCustomersPage from '../../sales/customers/page';
import { TradingEmbeddedPage } from '@/components/trade/TradingEmbeddedPage';

export default function TradingCustomersPage() {
  return (
    <TradingEmbeddedPage title="Trading Customers" sharedFrom="Sales Customers">
      <SalesCustomersPage />
    </TradingEmbeddedPage>
  );
}
