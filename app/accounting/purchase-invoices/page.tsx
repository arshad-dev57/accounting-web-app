'use client';

export const dynamic = 'force-dynamic';

import PurchaseInvoicesPage from '../../purchases/invoices/page';
import { ErpModuleProvider } from '@/lib/erp-module-context';

/** Purchase invoices hosted inside Accounting (same data/API as Purchases module). */
export default function AccountingPurchaseInvoicesPage() {
  return (
    <ErpModuleProvider module="accounting" pageTitle="Purchase Invoices">
      <PurchaseInvoicesPage />
    </ErpModuleProvider>
  );
}

export { AccountingPurchaseInvoicesPage as AccountingPurchaseInvoicesView };
