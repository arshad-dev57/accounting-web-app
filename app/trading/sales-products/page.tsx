'use client';

export const dynamic = 'force-dynamic';

import SalesProductsPage from '../../sales/products/page';
import { TradingEmbeddedPage } from '@/components/trade/TradingEmbeddedPage';

export default function TradingSalesProductsPage() {
  return (
    <TradingEmbeddedPage title="Trading Sales Products" sharedFrom="Sales Products">
      <SalesProductsPage />
    </TradingEmbeddedPage>
  );
}
