'use client';

export const dynamic = 'force-dynamic';

import PurchasesSuppliersPage from '../../purchases/suppliers/page';
import { TradingEmbeddedPage } from '@/components/trade/TradingEmbeddedPage';

export default function TradingSuppliersPage() {
  return (
    <TradingEmbeddedPage title="Trading Suppliers" sharedFrom="Purchase Suppliers">
      <PurchasesSuppliersPage />
    </TradingEmbeddedPage>
  );
}
