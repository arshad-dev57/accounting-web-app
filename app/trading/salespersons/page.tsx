'use client';

export const dynamic = 'force-dynamic';

import SalespersonsPage from '../../sales/salespersons/page';
import { TradingEmbeddedPage } from '@/components/trade/TradingEmbeddedPage';

export default function TradingSalespersonsPage() {
  return (
    <TradingEmbeddedPage title="Trading Salespersons" sharedFrom="Sales Salespersons">
      <SalespersonsPage />
    </TradingEmbeddedPage>
  );
}
