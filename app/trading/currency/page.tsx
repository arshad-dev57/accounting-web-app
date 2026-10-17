'use client';

export const dynamic = 'force-dynamic';

import PurchasesCurrencyPage from '../../purchases/currency/page';
import { TradingEmbeddedPage } from '@/components/trade/TradingEmbeddedPage';

export default function TradingCurrencyPage() {
  return (
    <TradingEmbeddedPage title="Trading Currency" sharedFrom="Purchases Currency">
      <PurchasesCurrencyPage />
    </TradingEmbeddedPage>
  );
}
