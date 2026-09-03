import type { ComponentType } from 'react';
import type { ModuleViewHostConfig } from '../../components/ModuleViewHost';

type Loader = ModuleViewHostConfig['viewLoaders'][string];

function loader(
  importFn: () => Promise<Record<string, unknown>>,
  exportName: string,
): Loader {
  return () =>
    importFn().then((mod) => ({
      default: mod[exportName] as ComponentType,
    }));
}

// ─── Sales ───────────────────────────────────────────────────────────
export const SALES_KEEP_ALIVE_ROUTES = [
  '/sales/dashboard',
  '/sales/reports',
  '/sales/products',
  '/sales/orders',
  '/sales/customers',
  '/sales/deliveries',
  '/sales/invoices',
  '/sales/sales-payment',
  '/sales/returns',
  '/sales/refunds',
  '/sales/currency',
] as const;

export const salesViewHostConfig: ModuleViewHostConfig = {
  routes: SALES_KEEP_ALIVE_ROUTES,
  viewLoaders: {
    '/sales/dashboard': loader(() => import('@/sales/dashboard/page'), 'SalesDashboardPage'),
    '/sales/reports': loader(() => import('@/sales/reports/page'), 'SalesReportsPage'),
    '/sales/products': loader(() => import('@/sales/products/page'), 'SalesProductsPage'),
    '/sales/orders': loader(() => import('@/sales/orders/page'), 'SalesOrdersPage'),
    '/sales/customers': loader(() => import('@/sales/customers/page'), 'SalesCustomersPage'),
    '/sales/deliveries': loader(() => import('@/sales/deliveries/page'), 'DeliveriesPage'),
    '/sales/invoices': loader(() => import('@/sales/invoices/page'), 'SalesInvoicesPage'),
    '/sales/sales-payment': loader(() => import('@/sales/sales-payment/page'), 'SalesPaymentsPage'),
    '/sales/returns': loader(() => import('@/sales/returns/page'), 'SalesReturnsPage'),
    '/sales/refunds': loader(() => import('@/sales/refunds/page'), 'SalesRefundsPage'),
    '/sales/currency': loader(() => import('@/sales/currency/page'), 'SalesCurrencyPage'),
  },
};

// ─── Accounting ──────────────────────────────────────────────────────
export const ACCOUNTING_KEEP_ALIVE_ROUTES = [
  '/accounting/dashboard',
  '/accounting/accounts',
  '/accounting/bank-Accounts',
  '/accounting/invoices',
  '/accounting/accounts-receivable',
  '/accounting/expenses',
  '/accounting/accounts-payable',
  '/accounting/income',
  '/accounting/journal-entries',
  '/accounting/general-ledger',
  '/accounting/trial-balance',
  '/accounting/fixed-assets',
  '/accounting/loans-borrowings',
  '/accounting/capital-equity',
  '/accounting/reports',
  '/accounting/profit-loss',
  '/accounting/balance-sheet',
  '/accounting/cash-flow',
  '/accounting/aged-recievables',
  '/accounting/fiscal-years',
  '/accounting/currency',
  '/accounting/pdf-reports',
] as const;

export const accountingViewHostConfig: ModuleViewHostConfig = {
  routes: ACCOUNTING_KEEP_ALIVE_ROUTES,
  viewLoaders: {
    '/accounting/dashboard': loader(() => import('@/accounting/dashboard/page'), 'AccountingDashboard'),
    '/accounting/accounts': loader(() => import('@/accounting/accounts/page'), 'ChartOfAccountsPage'),
    '/accounting/bank-Accounts': loader(() => import('@/accounting/bank-Accounts/page'), 'BankAccountsPage'),
    '/accounting/invoices': loader(() => import('@/accounting/invoices/page'), 'InvoicesPage'),
    '/accounting/accounts-receivable': loader(() => import('@/accounting/accounts-receivable/page'), 'AccountsReceivablePage'),
    '/accounting/expenses': loader(() => import('@/accounting/expenses/page'), 'ExpensesPage'),
    '/accounting/accounts-payable': loader(() => import('@/accounting/accounts-payable/page'), 'AccountsPayablePage'),
    '/accounting/income': loader(() => import('@/accounting/income/page'), 'IncomePage'),
    '/accounting/journal-entries': loader(() => import('@/accounting/journal-entries/page'), 'JournalEntriesPage'),
    '/accounting/general-ledger': loader(() => import('@/accounting/general-ledger/page'), 'GeneralLedgerPage'),
    '/accounting/trial-balance': loader(() => import('@/accounting/trial-balance/page'), 'TrialBalancePage'),
    '/accounting/fixed-assets': loader(() => import('@/accounting/fixed-assets/page'), 'FixedAssetsPage'),
    '/accounting/loans-borrowings': loader(() => import('@/accounting/loans-borrowings/page'), 'LoansBorrowingsPage'),
    '/accounting/capital-equity': loader(() => import('@/accounting/capital-equity/page'), 'CapitalEquityPage'),
    '/accounting/reports': loader(() => import('@/accounting/reports/page'), 'AccountingReportsPage'),
    '/accounting/profit-loss': loader(() => import('@/accounting/profit-loss/page'), 'ProfitLossPage'),
    '/accounting/balance-sheet': loader(() => import('@/accounting/balance-sheet/page'), 'BalanceSheetPage'),
    '/accounting/cash-flow': loader(() => import('@/accounting/cash-flow/page'), 'CashFlowPage'),
    '/accounting/aged-recievables': loader(() => import('@/accounting/aged-recievables/page'), 'AgedReceivablesPage'),
    '/accounting/fiscal-years': loader(() => import('@/accounting/fiscal-years/page'), 'FiscalYearsPage'),
    '/accounting/currency': loader(() => import('@/accounting/currency/page'), 'AccountingCurrencyPage'),
    '/accounting/pdf-reports': loader(() => import('@/accounting/pdf-reports/page'), 'PdfReportSettingsPage'),
  },
};

// ─── Warehouse ───────────────────────────────────────────────────────
export const WAREHOUSE_KEEP_ALIVE_ROUTES = [
  '/warehouse/dashboard',
  '/warehouse/products',
  '/warehouse/categories',
  '/warehouse/suppliers',
  '/warehouse/stock-movement',
  '/warehouse/locations',
  '/warehouse/customers',
  '/warehouse/inventory-valuation',
  '/warehouse/reports/stock-summary',
  '/warehouse/reports/low-stock',
  '/warehouse/reports/expiry',
  '/warehouse/reports',
  '/warehouse/product-settings',
] as const;

export const warehouseViewHostConfig: ModuleViewHostConfig = {
  routes: WAREHOUSE_KEEP_ALIVE_ROUTES,
  viewLoaders: {
    '/warehouse/dashboard': loader(() => import('@/warehouse/dashboard/page'), 'WarehouseDashboardPage'),
    '/warehouse/products': loader(() => import('@/warehouse/products/page'), 'ProductsPage'),
    '/warehouse/categories': loader(() => import('@/warehouse/categories/page'), 'CategoriesPage'),
    '/warehouse/suppliers': loader(() => import('@/warehouse/suppliers/page'), 'SuppliersPage'),
    '/warehouse/stock-movement': loader(() => import('@/warehouse/stock-movement/page'), 'StockMovementPage'),
    '/warehouse/locations': loader(() => import('@/warehouse/locations/page'), 'LocationsPage'),
    '/warehouse/customers': loader(() => import('@/warehouse/customers/page'), 'CustomersPage'),
    '/warehouse/inventory-valuation': loader(() => import('@/warehouse/inventory-valuation/page'), 'InventoryValuationPage'),
    '/warehouse/reports/stock-summary': loader(() => import('@/warehouse/reports/stock-summary/page'), 'StockSummaryReportPage'),
    '/warehouse/reports/low-stock': loader(() => import('@/warehouse/reports/low-stock/page'), 'LowStockReportPage'),
    '/warehouse/reports/expiry': loader(() => import('@/warehouse/reports/expiry/page'), 'ExpiryReportPage'),
    '/warehouse/reports': loader(() => import('@/warehouse/reports/page'), 'WarehouseReportsPage'),
    '/warehouse/product-settings': loader(() => import('@/warehouse/product-settings/page'), 'ProductSettingsPage'),
  },
};

// ─── Purchases ───────────────────────────────────────────────────────
export const PURCHASES_KEEP_ALIVE_ROUTES = [
  '/purchases/dashboard',
  '/purchases/reports',
  '/purchases/products',
  '/purchases/purchaseorder',
  '/purchases/suppliers',
  '/purchases/goodsRecieving',
  '/purchases/invoices',
  '/purchases/payments',
  '/purchases/returns',
  '/purchases/currency',
] as const;

export const purchasesViewHostConfig: ModuleViewHostConfig = {
  routes: PURCHASES_KEEP_ALIVE_ROUTES,
  viewLoaders: {
    '/purchases/dashboard': loader(() => import('@/purchases/dashboard/page'), 'PurchasesDashboardPage'),
    '/purchases/reports': loader(() => import('@/purchases/reports/page'), 'PurchaseReportsPage'),
    '/purchases/products': loader(() => import('@/purchases/products/page'), 'PurchasesProductsPage'),
    '/purchases/purchaseorder': loader(() => import('@/purchases/purchaseorder/page'), 'PurchaseOrdersPage'),
    '/purchases/suppliers': loader(() => import('@/purchases/suppliers/page'), 'PurchasesSuppliersPage'),
    '/purchases/goodsRecieving': loader(() => import('@/purchases/goodsRecieving/page'), 'GoodsReceivingPage'),
    '/purchases/invoices': loader(() => import('@/purchases/invoices/page'), 'PurchaseInvoicesPage'),
    '/purchases/payments': loader(() => import('@/purchases/payments/page'), 'PurchasePaymentsPage'),
    '/purchases/returns': loader(() => import('@/purchases/returns/page'), 'PurchaseReturnsPage'),
    '/purchases/currency': loader(() => import('@/purchases/currency/page'), 'PurchasesCurrencyPage'),
  },
};

// ─── Tax ─────────────────────────────────────────────────────────────
export const TAX_KEEP_ALIVE_ROUTES = [
  '/tax',
  '/tax/setup',
  '/tax/rates',
  '/tax/exemptions',
  '/tax/reports',
] as const;

export const taxViewHostConfig: ModuleViewHostConfig = {
  routes: TAX_KEEP_ALIVE_ROUTES,
  isKeepAliveRoute: (pathname) =>
    TAX_KEEP_ALIVE_ROUTES.some(
      (route) =>
        pathname === route ||
        (route !== '/tax' && pathname.startsWith(`${route}/`)),
    ),
  viewLoaders: {
    '/tax': loader(() => import('@/tax/page'), 'TaxOverviewPage'),
    '/tax/setup': loader(() => import('@/tax/setup/page'), 'TaxSetupPage'),
    '/tax/rates': loader(() => import('@/tax/rates/page'), 'TaxRatesPage'),
    '/tax/exemptions': loader(() => import('@/tax/exemptions/page'), 'TaxExemptionsPage'),
    '/tax/reports': loader(() => import('@/tax/reports/page'), 'TaxReportsPage'),
  },
};
