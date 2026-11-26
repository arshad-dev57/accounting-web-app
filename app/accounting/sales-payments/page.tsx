'use client';

export const dynamic = 'force-dynamic';

import { SalesPaymentsPage } from '../../sales/sales-payment/page';
import { ErpModuleProvider } from '@/lib/erp-module-context';

/** Sales payments hosted inside Accounting (same data/API as Sales module). */
export default function AccountingSalesPaymentsPage() {
  return (
    <ErpModuleProvider module="accounting" pageTitle="Sales Payments">
      <SalesPaymentsPage basePath="/accounting/sales-payments" />
    </ErpModuleProvider>
  );
}

export { AccountingSalesPaymentsPage as AccountingSalesPaymentsView };
