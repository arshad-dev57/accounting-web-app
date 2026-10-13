'use client';

export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import BankStatementImportPage from './ImportClient';

export default function BankStatementImportRoute() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-24 text-sm text-gray-400">Loading import wizard…</div>}>
      <BankStatementImportPage />
    </Suspense>
  );
}
