'use client';

export const dynamic = 'force-dynamic';

import GoodsReceivingPage from '../../purchases/goodsRecieving/page';
import { TradingEmbeddedPage } from '@/components/trade/TradingEmbeddedPage';

export default function TradingGoodsReceivingPage() {
  return (
    <TradingEmbeddedPage title="Trading Goods Receiving" sharedFrom="Purchases GRN">
      <GoodsReceivingPage />
    </TradingEmbeddedPage>
  );
}
