'use client';

export const dynamic = 'force-dynamic';

import PurchasesProductsPage from '../../purchases/products/page';
import { TradingEmbeddedPage } from '@/components/trade/TradingEmbeddedPage';

export default function TradingPurchaseProductsPage() {
  return (
    <TradingEmbeddedPage title="Trading Purchase Products" sharedFrom="Purchase Products">
      <PurchasesProductsPage />
    </TradingEmbeddedPage>
  );
}
