'use client';

export const dynamic = 'force-dynamic';

import PurchaseRequisitionsPage from '../../purchases/requisitions/page';
import { TradingEmbeddedPage } from '@/components/trade/TradingEmbeddedPage';

export default function TradingRequisitionsPage() {
  return (
    <TradingEmbeddedPage title="Trading Purchase Requisitions" sharedFrom="Purchase Requisitions">
      <PurchaseRequisitionsPage />
    </TradingEmbeddedPage>
  );
}
