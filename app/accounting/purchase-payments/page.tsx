'use client';

export const dynamic = 'force-dynamic';

import PurchasePaymentsPage from '../../purchases/payments/page';
import { ErpModuleProvider } from '@/lib/erp-module-context';

/** Purchase payments hosted inside Accounting (same data/API as Purchases module). */
export default function AccountingPurchasePaymentsPage() {
  return (
    <ErpModuleProvider module="accounting" pageTitle="Purchase Payments">
      <PurchasePaymentsPage />
    </ErpModuleProvider>
  );
}

export { AccountingPurchasePaymentsPage as AccountingPurchasePaymentsView };
