/**
 * Human-readable labels for RBAC permission keys (module.resource.action).
 * Used by Effective Permissions modal and related UIs.
 */

const MODULE_LABELS: Record<string, string> = {
  sales: 'Sales',
  purchases: 'Purchases',
  inventory: 'Inventory & Warehouse',
  accounting: 'Accounting & Finance',
  pos: 'Point of Sale',
  hr: 'HR Management',
  manufacturing: 'Manufacturing',
  distributor: 'Distributor',
  reports: 'Reports',
  dashboard: 'Dashboard Selection',
  settings: 'Settings & Users',
  tax: 'Tax Compliance',
};

const RESOURCE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  // Sales
  orders: 'Sales Orders',
  quotations: 'Quotations',
  invoices: 'Invoices',
  customers: 'Customers',
  salespersons: 'Salespersons & Territories',
  deliveries: 'Deliveries',
  payments: 'Payments',
  returns: 'Returns',
  refunds: 'Refunds',
  credits: 'Credit Notes',
  products: 'Products',
  reports: 'Reports',
  currency: 'Display Currency',
  settings: 'Settings',
  // Purchases
  requisitions: 'Purchase Requisitions',
  grn: 'Goods Receiving (GRN)',
  suppliers: 'Suppliers',
  receipts: 'Receipts',
  // Inventory
  categories: 'Categories',
  warehouses: 'Warehouses & Locations',
  stock: 'Stock Movements',
  transfers: 'Stock Transfers',
  adjustments: 'Stock Adjustments',
  write_offs: 'Write-Offs',
  import: 'Import Inventory',
  inventory_valuation: 'Inventory Valuation',
  product_settings: 'Product Settings',
  // Accounting
  chart_of_accounts: 'Chart of Accounts',
  journal_entries: 'Journal Entries',
  general_ledger: 'General Ledger',
  trial_balance: 'Trial Balance',
  bank_accounts: 'Bank & Cash Accounts',
  bank_reconciliation: 'Bank Reconciliation',
  accounts_receivable: 'Accounts Receivable',
  accounts_payable: 'Accounts Payable',
  aged_receivables: 'Aged Receivables',
  expenses: 'Expenses',
  income: 'Income',
  cost_centers: 'Cost Centers',
  budgets: 'Budgets',
  capital_equity: 'Capital & Equity',
  fixed_assets: 'Fixed Assets',
  loans: 'Loans & Borrowings',
  fiscal_years: 'Fiscal Years',
  profit_loss: 'Profit & Loss',
  balance_sheet: 'Balance Sheet',
  cash_flow: 'Cash Flow',
  currencies: 'Currency Master',
  exchange_rates: 'Exchange Rates',
  pdf_reports: 'PDF Reports',
  // Tax
  overview: 'Overview',
  setup: 'Tax Setup',
  rates: 'Tax Rates',
  exemptions: 'Tax Exemptions',
  // POS
  register: 'POS Register',
  shifts: 'Cashier Shifts',
  terminals: 'POS Terminals',
  management: 'POS Management',
  // HR
  employees: 'Employees',
  offices: 'Offices',
  departments: 'Departments',
  team: 'My Team',
  attendance: 'Attendance',
  leaves: 'Leave Management',
  leave_policies: 'Leave Policies',
  holidays: 'Holidays',
  overtime: 'Overtime',
  roster: 'Roster',
  calendar: 'HR Calendar',
  documents: 'Documents',
  approvals: 'Approvals',
  performance: 'Performance Reviews',
  org_chart: 'Organization Chart',
  lifecycle: 'Employee Lifecycle',
  live_tracking: 'Live Tracking',
  salary: 'Salary & Compensation',
  salary_structures: 'Salary Structures',
  payroll: 'Payroll Processing',
  bonuses: 'Bonuses',
  commissions: 'Sales Commission',
  notifications: 'Notifications',
  // Manufacturing
  bom: 'Bill of Materials',
  routings: 'Routings & Operations',
  work_centers: 'Work Centers & Machines',
  planning: 'Planning (MPS / MRP)',
  materials: 'Material Issues',
  quality: 'Quality',
  maintenance: 'Maintenance',
  subcontracting: 'Subcontracting',
  costing: 'Costing',
  // Distributor
  aging: 'Aging',
  credit: 'Credit Limits',
  recovery: 'Recovery',
  // Reports
  financial: 'Financial Reports',
  sales: 'Sales Reports',
  purchases: 'Purchase Reports',
  inventory: 'Inventory Reports',
  tax: 'Tax Reports',
  hr: 'HR Reports',
  manufacturing: 'Manufacturing Reports',
  // Dashboard tiles
  module_accounting: 'Module: Accounting',
  module_sales: 'Module: Sales',
  module_purchases: 'Module: Purchases',
  module_inventory: 'Module: Inventory',
  module_manufacturing: 'Module: Manufacturing',
  module_hr: 'Module: HR',
  module_tax: 'Module: Tax',
  module_users: 'Module: Users',
  module_pos: 'Module: Point of Sale',
  module_distributor: 'Module: Distributor',
  widgets_sales: 'Widget: Sales',
  widgets_purchases: 'Widget: Purchases',
  widgets_financial: 'Widget: Financial',
  widgets_cash_bank: 'Widget: Cash & Bank',
  widgets_ar_ap: 'Widget: AR / AP',
  widgets_inventory: 'Widget: Inventory',
  widgets_capital: 'Widget: Capital',
  // Settings
  company: 'Company Profile',
  users: 'User Management',
  roles: 'Roles & Permissions',
  audit_logs: 'Audit Logs',
  companies: 'Multi-Company',
};

const ACTION_LABELS: Record<string, string> = {
  view: 'View',
  create: 'Create',
  edit: 'Edit',
  delete: 'Delete',
  approve: 'Approve',
  post: 'Post',
  reverse: 'Reverse',
  cancel: 'Cancel',
  print: 'Print',
  export: 'Export',
  import: 'Import',
  receive: 'Receive Payment',
  pay: 'Pay',
  void: 'Void',
  close: 'Close',
  reopen: 'Reopen',
  transfer: 'Transfer',
  adjust: 'Adjust',
  reject: 'Reject',
};

const SOURCE_LABELS: Record<string, string> = {
  DEFAULT_DENY: 'Not granted',
  COMPANY_OWNER: 'Company owner',
  ADMIN_ROLE: 'Admin role',
  USER_OVERRIDE_ALLOW: 'Manually allowed',
  USER_OVERRIDE_DENY: 'Manually denied',
  LEGACY_USER_PERMISSION: 'Legacy page permission',
};

export function moduleLabel(moduleKey: string): string {
  const k = String(moduleKey || '').toLowerCase();
  return MODULE_LABELS[k] || k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function resourceLabel(resourceKey: string): string {
  const k = String(resourceKey || '').toLowerCase();
  return RESOURCE_LABELS[k] || k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function actionLabel(actionKey: string): string {
  const k = String(actionKey || '').toLowerCase();
  return ACTION_LABELS[k] || k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function sourceLabel(source: string): string {
  const s = String(source || '');
  if (SOURCE_LABELS[s]) return SOURCE_LABELS[s];
  if (s.startsWith('ROLE:')) return `From role: ${s.slice(5)}`;
  return s.replace(/_/g, ' ');
}

export function permissionDisplayName(parts: {
  module?: string;
  resource?: string;
  action?: string;
  key?: string;
}): { title: string; subtitle: string; moduleName: string } {
  const fromKey = String(parts.key || '').split('.');
  const module = parts.module || fromKey[0] || '';
  const resource = parts.resource || fromKey[1] || '';
  const action = parts.action || fromKey[2] || '';

  const moduleName = moduleLabel(module);
  const pageName = resourceLabel(resource);
  const actName = actionLabel(action);

  return {
    moduleName,
    title: `${pageName} · ${actName}`,
    subtitle: moduleName,
  };
}
