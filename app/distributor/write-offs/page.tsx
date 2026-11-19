'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
import StockWriteOffsPage from '../../warehouse/write-offs/page';

/** Distributor shell reuses the warehouse write-off register UI. */
export default function DistributorWriteOffsPage() {
  return <StockWriteOffsPage />;
}
