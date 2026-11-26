'use client';

export const dynamic = 'force-dynamic';

import { SalesInvoicesPage } from '../../sales/invoices/page';
import { ErpModuleProvider } from '@/lib/erp-module-context';

/** Sales invoices hosted inside Accounting (same data/API as Sales module). */
export default function AccountingSalesInvoicesPage() {
  return (
    <ErpModuleProvider module="accounting" pageTitle="Sales Invoices">
      <SalesInvoicesPage preferWizardCreate />
    </ErpModuleProvider>
  );
}

export { AccountingSalesInvoicesPage as AccountingSalesInvoicesView };
