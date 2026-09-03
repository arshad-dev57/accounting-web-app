#!/usr/bin/env node
/**
 * Patches module page.tsx files for ModuleViewHost:
 * - Renames export default function X → export function X
 * - Appends ModuleRoutePlaceholder default export
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const PATCHES = [
  { file: 'app/accounting/dashboard/page.tsx', exportName: 'AccountingDashboard' },
  { file: 'app/accounting/accounts/page.tsx', exportName: 'ChartOfAccountsPage' },
  { file: 'app/accounting/bank-Accounts/page.tsx', exportName: 'BankAccountsPage' },
  { file: 'app/accounting/invoices/page.tsx', exportName: 'InvoicesPage' },
  { file: 'app/accounting/accounts-receivable/page.tsx', exportName: 'AccountsReceivablePage' },
  { file: 'app/accounting/expenses/page.tsx', exportName: 'ExpensesPage' },
  { file: 'app/accounting/accounts-payable/page.tsx', exportName: 'AccountsPayablePage' },
  { file: 'app/accounting/income/page.tsx', exportName: 'IncomePage' },
  { file: 'app/accounting/journal-entries/page.tsx', exportName: 'JournalEntriesPage' },
  { file: 'app/accounting/general-ledger/page.tsx', exportName: 'GeneralLedgerPage' },
  { file: 'app/accounting/trial-balance/page.tsx', exportName: 'TrialBalancePage' },
  { file: 'app/accounting/fixed-assets/page.tsx', exportName: 'FixedAssetsPage' },
  { file: 'app/accounting/loans-borrowings/page.tsx', exportName: 'LoansBorrowingsPage' },
  { file: 'app/accounting/capital-equity/page.tsx', exportName: 'CapitalEquityPage' },
  { file: 'app/accounting/reports/page.tsx', exportName: 'AccountingReportsPage' },
  { file: 'app/accounting/profit-loss/page.tsx', exportName: 'ProfitLossPage' },
  { file: 'app/accounting/balance-sheet/page.tsx', exportName: 'BalanceSheetPage' },
  { file: 'app/accounting/cash-flow/page.tsx', exportName: 'CashFlowPage' },
  { file: 'app/accounting/aged-recievables/page.tsx', exportName: 'AgedReceivablesPage' },
  { file: 'app/accounting/fiscal-years/page.tsx', exportName: 'FiscalYearsPage' },
  { file: 'app/accounting/currency/page.tsx', exportName: 'AccountingCurrencyPage' },
  { file: 'app/accounting/pdf-reports/page.tsx', exportName: 'PdfReportSettingsPage' },
  { file: 'app/warehouse/dashboard/page.tsx', exportName: 'WarehouseDashboardPage' },
  { file: 'app/warehouse/products/page.tsx', exportName: 'ProductsPage' },
  { file: 'app/warehouse/categories/page.tsx', exportName: 'CategoriesPage' },
  { file: 'app/warehouse/suppliers/page.tsx', exportName: 'SuppliersPage' },
  { file: 'app/warehouse/stock-movement/page.tsx', exportName: 'StockMovementPage' },
  { file: 'app/warehouse/locations/page.tsx', exportName: 'LocationsPage' },
  { file: 'app/warehouse/customers/page.tsx', exportName: 'CustomersPage' },
  { file: 'app/warehouse/inventory-valuation/page.tsx', exportName: 'InventoryValuationPage' },
  { file: 'app/warehouse/reports/stock-summary/page.tsx', exportName: 'StockSummaryReportPage' },
  { file: 'app/warehouse/reports/low-stock/page.tsx', exportName: 'LowStockReportPage' },
  { file: 'app/warehouse/reports/expiry/page.tsx', exportName: 'ExpiryReportPage' },
  { file: 'app/warehouse/reports/page.tsx', exportName: 'WarehouseReportsPage' },
  { file: 'app/warehouse/product-settings/page.tsx', exportName: 'ProductSettingsPage' },
  { file: 'app/purchases/dashboard/page.tsx', exportName: 'PurchasesDashboardPage' },
  { file: 'app/purchases/reports/page.tsx', exportName: 'PurchaseReportsPage' },
  { file: 'app/purchases/purchaseorder/page.tsx', exportName: 'PurchaseOrdersPage' },
  { file: 'app/purchases/goodsRecieving/page.tsx', exportName: 'GoodsReceivingPage' },
  { file: 'app/purchases/invoices/page.tsx', exportName: 'PurchaseInvoicesPage' },
  { file: 'app/purchases/payments/page.tsx', exportName: 'PurchasePaymentsPage' },
  { file: 'app/purchases/returns/page.tsx', exportName: 'PurchaseReturnsPage' },
  { file: 'app/purchases/currency/page.tsx', exportName: 'PurchasesCurrencyPage' },
  { file: 'app/tax/page.tsx', exportName: 'TaxOverviewPage' },
  { file: 'app/tax/setup/page.tsx', exportName: 'TaxSetupPage' },
  { file: 'app/tax/rates/page.tsx', exportName: 'TaxRatesPage' },
  { file: 'app/tax/exemptions/page.tsx', exportName: 'TaxExemptionsPage' },
  { file: 'app/tax/reports/page.tsx', exportName: 'TaxReportsPage' },
];

const PLACEHOLDER = `
/** Next.js route shell — real UI mounts via ModuleViewHost. */
export default function ModuleRoutePlaceholder() {
  return null;
}
`;

for (const { file, exportName } of PATCHES) {
  const fullPath = path.join(ROOT, file);
  if (!fs.existsSync(fullPath)) {
    console.warn('skip missing:', file);
    continue;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  if (content.includes('ModuleRoutePlaceholder')) {
    console.log('already patched:', file);
    continue;
  }

  const pattern = new RegExp(`export default function ${exportName}\\b`);
  if (!pattern.test(content)) {
    console.warn('export not found:', file, exportName);
    continue;
  }

  content = content.replace(pattern, `export function ${exportName}`);
  content = content.trimEnd() + PLACEHOLDER;
  fs.writeFileSync(fullPath, content);
  console.log('patched:', file);
}

console.log('done');
