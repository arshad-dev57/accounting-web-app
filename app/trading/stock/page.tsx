'use client';

export const dynamic = 'force-dynamic';

import WarehouseProductsPage from '../../warehouse/products/page';
import { TradingEmbeddedPage } from '@/components/trade/TradingEmbeddedPage';

export default function TradingStockPage() {
  return (
    <TradingEmbeddedPage title="Trading Stock / Products" sharedFrom="Inventory Products">
      <WarehouseProductsPage />
    </TradingEmbeddedPage>
  );
}
