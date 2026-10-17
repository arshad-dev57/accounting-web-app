'use client';

export const dynamic = 'force-dynamic';

import PurchaseReportsPage from '../../purchases/reports/page';
import { TradingEmbeddedPage } from '@/components/trade/TradingEmbeddedPage';

export default function TradingPurchaseReportsPage() {
  return (
    <TradingEmbeddedPage title="Trading Purchase Reports" sharedFrom="Purchase Reports">
      <PurchaseReportsPage />
    </TradingEmbeddedPage>
  );
}
