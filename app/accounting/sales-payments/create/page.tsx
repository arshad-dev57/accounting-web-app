'use client';

export const dynamic = 'force-dynamic';

import { CreateSalesPaymentPage } from '../../../sales/sales-payment/create/page';
import { ErpModuleProvider } from '@/lib/erp-module-context';

/** Create sales payment while staying in Accounting. */
export default function AccountingCreateSalesPaymentPage() {
  return (
    <ErpModuleProvider module="accounting" pageTitle="Receive Sales Payment">
      <CreateSalesPaymentPage returnPath="/accounting/sales-payments" />
    </ErpModuleProvider>
  );
}

export { AccountingCreateSalesPaymentPage as AccountingCreateSalesPaymentView };
