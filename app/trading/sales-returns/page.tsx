'use client';

export const dynamic = 'force-dynamic';

import { SalesReturnsPage } from '../../sales/returns/page';
import { TradingEmbeddedPage } from '@/components/trade/TradingEmbeddedPage';

export default function TradingSalesReturnsPage() {
  return (
    <TradingEmbeddedPage title="Trading Sales Returns" sharedFrom="Sales Returns">
      <SalesReturnsPage />
    </TradingEmbeddedPage>
  );
}
