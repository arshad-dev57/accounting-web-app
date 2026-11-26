/**
 * Global page search registry.
 *
 * Every routable page of the app is registered here so the header search
 * (components/GlobalSearch.tsx) can find and navigate to any page.
 *
 * Permission handling mirrors the module sidebars:
 *  - `module` + `permission` are exactly the values passed to
 *    `hasSubPageAccess(module, permission)` used by that module's sidebar.
 *  - `adminOnly` / `ownerOnly` mirror sidebar rules that are admin or
 *    platform-owner specific.
 */

export type GlobalSearchGroupKey =
  | 'home'
  | 'accounting'
  | 'sales'
  | 'crm'
  | 'purchases'
  | 'warehouse'
  | 'manufacturing'
  | 'import'
  | 'export'
  | 'trading'
  | 'hr'
  | 'tax'
  | 'settings'
  | 'pos'
  | 'projects'
  | 'meetings'
  | 'notices'
  | 'appointments';

export type GlobalSearchPage = {
  /** Route of the page (must exist under app/) */
  path: string;
  /** Label shown in the results list */
  label: string;
  /** Group used for the section header + icon in the results list */
  group: GlobalSearchGroupKey;
  /** Permission namespace, e.g. "accounting" (skip for always-visible pages) */
  module?: string;
  /** Sub-page permission key used by that module sidebar */
  permission?: string;
  /** Page is only visible for administrator accounts */
  adminOnly?: boolean;
  /** Page is only visible for platform owners */
  ownerOnly?: boolean;
  /** Extra search terms / aliases */
  keywords?: string[];
};

export const SEARCH_GROUPS: Record<
  GlobalSearchGroupKey,
  { label: string; href: string }
> = {
  home: { label: 'Main Menu', href: '/dashboard' },
  accounting: { label: 'Accounting', href: '/accounting/dashboard' },
  sales: { label: 'Sales', href: '/sales/dashboard' },
  crm: { label: 'CRM & Leads', href: '/crm/dashboard' },
  purchases: { label: 'Purchases', href: '/purchases/dashboard' },
  warehouse: { label: 'Inventory', href: '/warehouse/dashboard' },
  manufacturing: { label: 'Manufacturing', href: '/manufacturing/manufacturing' },
  import: { label: 'Import Management', href: '/import/dashboard' },
  export: { label: 'Export Management', href: '/export/dashboard' },
  trading: { label: 'Trading Management', href: '/trading/dashboard' },
  hr: { label: 'HR', href: '/hr/hr-setup' },
  tax: { label: 'Tax', href: '/tax' },
  settings: { label: 'Settings', href: '/settings/invoice-numbers' },
  pos: { label: 'Point of Sale', href: '/pos' },
  projects: { label: 'Project Management', href: '/projects/dashboard' },
  meetings: { label: 'Meeting Management', href: '/meetings/dashboard' },
  notices: { label: 'Notice Board', href: '/notices/dashboard' },
  appointments: { label: 'Appointment Booking', href: '/appointments/dashboard' },
};

/** Pages shown when the search box is empty (quick access) */
export const QUICK_ACCESS_LIMIT = 8;

export const GLOBAL_SEARCH_PAGES: GlobalSearchPage[] = [
  // ============================ Main menu ============================
  {
    path: '/dashboard',
    label: 'Main Dashboard',
    group: 'home',
    keywords: ['home', 'hub', 'modules', 'start'],
  },
  {
    path: '/products',
    label: 'Products Management',
    group: 'home',
    keywords: ['items', 'catalog', 'sku', 'product list'],
  },
  {
    path: '/pos',
    label: 'Point of Sale',
    group: 'pos',
    keywords: ['pos', 'cashier', 'checkout', 'counter', 'terminal'],
  },
  {
    path: '/pos/management',
    label: 'POS Management',
    group: 'pos',
    keywords: ['pos settings', 'pos admin', 'pos terminals'],
  },
  {
    path: '/support',
    label: 'Support Tickets',
    group: 'home',
    keywords: ['help', 'complaint', 'issue', 'ticket'],
  },
  {
    path: '/billing',
    label: 'Billing & Invoices',
    group: 'home',
    adminOnly: true,
    keywords: ['payment history', 'subscription billing', 'invoices'],
  },
  {
    path: '/plans',
    label: 'Subscription Plans',
    group: 'home',
    adminOnly: true,
    keywords: ['pricing', 'upgrade', 'plan', 'tier'],
  },
  {
    path: '/users',
    label: 'Users & Permissions',
    group: 'home',
    adminOnly: true,
    keywords: ['user accounts', 'roles', 'access', 'permissions', 'team'],
  },
  {
    path: '/registered-users',
    label: 'Registered Users',
    group: 'home',
    ownerOnly: true,
    keywords: ['signups', 'registrations', 'sign up'],
  },
  // ============================ Accounting ============================
  { path: '/accounting/dashboard', label: 'Accounting Dashboard', group: 'accounting', module: 'accounting', permission: 'dashboard', keywords: ['overview', 'home'] },
  { path: '/accounting/accounts', label: 'Chart of Accounts', group: 'accounting', module: 'accounting', permission: 'chart-of-accounts', keywords: ['coa', 'ledger accounts', 'account list'] },
  { path: '/accounting/chart-of-acounts', label: 'Chart of Accounts (Classic)', group: 'accounting', module: 'accounting', permission: 'chart-of-accounts', keywords: ['coa', 'ledger'] },
  { path: '/accounting/bank-Accounts', label: 'Bank Accounts', group: 'accounting', module: 'accounting', permission: 'bank-accounts', keywords: ['bank', 'cash', 'cashbook'] },
  { path: '/accounting/bank-Accounts/transfer', label: 'Bank Transfer', group: 'accounting', module: 'accounting', permission: 'bank-accounts', keywords: ['fund transfer', 'bank to bank'] },
  { path: '/sales/invoices', label: 'Sales Invoices', group: 'sales', module: 'sales', permission: 'invoices', keywords: ['billing', 'sales invoice', 'customer invoice'] },
  { path: '/purchases/invoices', label: 'Purchase Invoices', group: 'purchases', module: 'purchases', permission: 'invoices', keywords: ['billing', 'purchase invoice', 'vendor invoice', 'grn invoice'] },
  { path: '/accounting/payments-received', label: 'Payments Received', group: 'accounting', module: 'accounting', permission: 'payments-received', keywords: ['receipts', 'customer payments'] },
  { path: '/accounting/credit-notes', label: 'Credit Notes', group: 'accounting', module: 'accounting', permission: 'credit-notes', keywords: ['credit memo', 'adjustment'] },
  { path: '/accounting/accounts-receivable', label: 'Accounts Receivable', group: 'accounting', module: 'accounting', permission: 'accounts-receivable', keywords: ['ar', 'debtors', 'receivables'] },
  { path: '/accounting/bills', label: 'Bills', group: 'accounting', module: 'accounting', permission: 'bills', keywords: ['vendor bill', 'supplier bill'] },
  { path: '/accounting/payments-made', label: 'Payments Made', group: 'accounting', module: 'accounting', permission: 'payments-made', keywords: ['vendor payments', 'supplier payments'] },
  { path: '/accounting/expenses', label: 'Expenses', group: 'accounting', module: 'accounting', permission: 'expenses', keywords: ['cost', 'spending'] },
  { path: '/accounting/accounts-payable', label: 'Accounts Payable', group: 'accounting', module: 'accounting', permission: 'accounts-payable', keywords: ['ap', 'creditors', 'payables'] },
  { path: '/accounting/income', label: 'Income', group: 'accounting', module: 'accounting', permission: 'income', keywords: ['revenue', 'other income'] },
  { path: '/accounting/journal-entries', label: 'Journal Entries', group: 'accounting', module: 'accounting', permission: 'journal-entries', keywords: ['je', 'double entry', 'voucher'] },
  { path: '/accounting/general-ledger', label: 'General Ledger', group: 'accounting', module: 'accounting', permission: 'general-ledger', keywords: ['gl', 'ledger'] },
  { path: '/accounting/trial-balance', label: 'Trial Balance', group: 'accounting', module: 'accounting', permission: 'trial-balance', keywords: ['debit credit', 'tb'] },
  { path: '/accounting/fixed-assets', label: 'Fixed Assets', group: 'accounting', module: 'accounting', permission: 'fixed-assets', keywords: ['depreciation', 'asset register'] },
  { path: '/accounting/loans-borrowings', label: 'Loans & Borrowings', group: 'accounting', module: 'accounting', permission: 'loans-borrowings', keywords: ['loan', 'liability', 'debt'] },
  { path: '/accounting/capital-equity', label: 'Capital & Equity', group: 'accounting', module: 'accounting', permission: 'capital-equity', keywords: ['equity', 'owner capital'] },
  { path: '/accounting/reports', label: 'Accounting Reports', group: 'accounting', module: 'accounting', permission: 'journal-entries', keywords: ['financial reports'] },
  { path: '/accounting/profit-loss', label: 'Profit & Loss', group: 'accounting', module: 'accounting', permission: 'profit-loss', keywords: ['pnl', 'income statement', 'p and l'] },
  { path: '/accounting/balance-sheet', label: 'Balance Sheet', group: 'accounting', module: 'accounting', permission: 'balance-sheet', keywords: ['assets liabilities', 'financial position'] },
  { path: '/accounting/cash-flow', label: 'Cash Flow', group: 'accounting', module: 'accounting', permission: 'cash-flow', keywords: ['cash flow statement', 'liquidity'] },
  { path: '/accounting/aged-recievables', label: 'Aged Receivables', group: 'accounting', module: 'accounting', permission: 'aged-receivables', keywords: ['aging', 'overdue'] },
  { path: '/accounting/fiscal-years', label: 'Fiscal Years', group: 'accounting', module: 'accounting', permission: 'settings', keywords: ['period', 'year close'] },
  { path: '/settings/currency', label: 'Currency Settings', group: 'settings', module: 'settings', keywords: ['exchange rate', 'forex', 'display currency', 'conversion', 'currency master'] },
  { path: '/settings/pdf-reports', label: 'PDF Reports', group: 'settings', module: 'settings', keywords: ['download reports', 'print', 'letterhead', 'pdf branding'] },
  // ============================== Sales ==============================
  { path: '/sales/dashboard', label: 'Sales Dashboard', group: 'sales', module: 'sales', permission: 'dashboard', keywords: ['overview'] },
  { path: '/notes', label: 'Local Notes', group: 'home', keywords: ['notes', 'todo', 'checklist', 'sticky', 'local'] },
  { path: '/projects/dashboard', label: 'Project Dashboard', group: 'projects', module: 'projects', permission: 'dashboard', keywords: ['projects', 'tasks', 'kanban', 'gantt', 'milestones'] },
  { path: '/projects/list', label: 'Projects', group: 'projects', module: 'projects', permission: 'projects', keywords: ['project list'] },
  { path: '/projects/board', label: 'Project Kanban', group: 'projects', module: 'projects', permission: 'tasks', keywords: ['board', 'kanban'] },
  { path: '/projects/time', label: 'Project Time Tracking', group: 'projects', module: 'projects', permission: 'time', keywords: ['timesheet', 'timer'] },
  { path: '/meetings/dashboard', label: 'Meeting Dashboard', group: 'meetings', module: 'meetings', permission: 'dashboard', keywords: ['meetings', 'agenda', 'minutes'] },
  { path: '/meetings/list', label: 'Meetings', group: 'meetings', module: 'meetings', permission: 'meetings', keywords: ['schedule meeting'] },
  { path: '/meetings/action-items', label: 'Meeting Action Items', group: 'meetings', module: 'meetings', permission: 'action_items', keywords: ['follow up', 'actions'] },
  { path: '/notices/dashboard', label: 'Notice Board Dashboard', group: 'notices', module: 'notices', permission: 'dashboard', keywords: ['announcements', 'notice board'] },
  { path: '/notices/list', label: 'Notices', group: 'notices', module: 'notices', permission: 'notices', keywords: ['publish notice', 'hr notice'] },
  { path: '/appointments/dashboard', label: 'Appointment Dashboard', group: 'appointments', module: 'appointments', permission: 'dashboard', keywords: ['booking', 'scheduling'] },
  { path: '/appointments/bookings', label: 'Appointment Bookings', group: 'appointments', module: 'appointments', permission: 'bookings', keywords: ['reservations'] },
  { path: '/appointments/public', label: 'Public Booking Settings', group: 'appointments', module: 'appointments', permission: 'public_page', keywords: ['booking link', 'public page'] },
  { path: '/crm/dashboard', label: 'CRM Dashboard', group: 'crm', module: 'crm', permission: 'dashboard', keywords: ['crm', 'leads', 'pipeline', 'opportunities'] },
  { path: '/crm/leads', label: 'Leads', group: 'crm', module: 'crm', permission: 'leads', keywords: ['lead', 'prospect'] },
  { path: '/crm/opportunities', label: 'Opportunities', group: 'crm', module: 'crm', permission: 'opportunities', keywords: ['deal', 'pipeline'] },
  { path: '/crm/accounts', label: 'CRM Customers', group: 'crm', module: 'crm', permission: 'accounts', keywords: ['account', 'customer'] },
  { path: '/crm/contacts', label: 'CRM Contacts', group: 'crm', module: 'crm', permission: 'contacts', keywords: ['contact', 'person'] },
  { path: '/crm/pipeline', label: 'Sales Pipeline', group: 'crm', module: 'crm', permission: 'pipeline', keywords: ['kanban', 'stages'] },
  { path: '/crm/tasks', label: 'CRM Tasks', group: 'crm', module: 'crm', permission: 'tasks', keywords: ['todo', 'task'] },
  { path: '/crm/follow-ups', label: 'CRM Follow-ups', group: 'crm', module: 'crm', permission: 'follow_ups', keywords: ['followup', 'reminder'] },
  { path: '/crm/calendar', label: 'CRM Calendar', group: 'crm', module: 'crm', permission: 'calendar', keywords: ['schedule', 'appointments'] },
  { path: '/crm/campaigns', label: 'Campaigns', group: 'crm', module: 'crm', permission: 'campaigns', keywords: ['marketing', 'campaign'] },
  { path: '/crm/activities', label: 'Communications', group: 'crm', module: 'crm', permission: 'activities', keywords: ['activity', 'call', 'email', 'meeting'] },
  { path: '/crm/reports', label: 'CRM Reports', group: 'crm', module: 'crm', permission: 'reports', keywords: ['analytics', 'query report'] },
  { path: '/crm/reports/lead-details', label: 'Lead Details', group: 'crm', module: 'crm', permission: 'reports', keywords: ['lead report'] },
  { path: '/crm/reports/sales-pipeline-analytics', label: 'Sales Pipeline Analytics', group: 'crm', module: 'crm', permission: 'reports', keywords: ['pipeline report'] },
  { path: '/crm/reports/opportunity-summary-by-sales-stage', label: 'Opportunity Summary by Sales Stage', group: 'crm', module: 'crm', permission: 'reports', keywords: ['stage report'] },
  { path: '/crm/reports/sales-funnel', label: 'Sales Funnel', group: 'crm', module: 'crm', permission: 'reports', keywords: ['funnel'] },
  { path: '/crm/reports/prospects-engaged-but-not-converted', label: 'Prospects Engaged But Not Converted', group: 'crm', module: 'crm', permission: 'reports', keywords: ['prospect report'] },
  { path: '/crm/reports/first-response-time-for-opportunity', label: 'First Response Time for Opportunity', group: 'crm', module: 'crm', permission: 'reports', keywords: ['response time'] },
  { path: '/crm/reports/inactive-customers', label: 'Inactive Customers', group: 'crm', module: 'crm', permission: 'reports', keywords: ['inactive'] },
  { path: '/crm/reports/campaign-efficiency', label: 'Campaign Efficiency', group: 'crm', module: 'crm', permission: 'reports', keywords: ['campaign report'] },
  { path: '/crm/reports/lead-owner-efficiency', label: 'Lead Owner Efficiency', group: 'crm', module: 'crm', permission: 'reports', keywords: ['owner report'] },
  { path: '/crm/settings', label: 'CRM Settings', group: 'crm', module: 'crm', permission: 'settings', keywords: ['config'] },
  { path: '/sales/reports', label: 'Sales Reports', group: 'sales', module: 'sales', permission: 'dashboard', keywords: ['analytics'] },
  { path: '/sales/products', label: 'Sales Products', group: 'sales', module: 'sales', permission: 'products', keywords: ['catalog', 'items'] },
  { path: '/sales/quotations', label: 'Quotations', group: 'sales', module: 'sales', permission: 'orders', keywords: ['quotes', 'estimate'] },
  { path: '/sales/orders', label: 'Sales Orders', group: 'sales', module: 'sales', permission: 'orders', keywords: ['so', 'customer order'] },
  { path: '/sales/customers', label: 'Customers', group: 'sales', module: 'sales', permission: 'customers', keywords: ['clients', 'buyers'] },
  { path: '/sales/deliveries', label: 'Sales Deliveries', group: 'sales', module: 'sales', permission: 'deliveries', keywords: ['shipping', 'dispatch', 'delivery note'] },
  { path: '/sales/invoices', label: 'Sales Invoices', group: 'sales', module: 'sales', permission: 'invoices', keywords: ['billing'] },
  { path: '/sales/sales-payment', label: 'Sales Payments', group: 'sales', module: 'sales', permission: 'sales-payments', keywords: ['receipts', 'cash in'] },
  { path: '/sales/returns', label: 'Sales Returns', group: 'sales', module: 'sales', permission: 'sales-returns', keywords: ['rma', 'returned goods'] },
  { path: '/sales/refunds', label: 'Sales Refunds', group: 'sales', module: 'sales', permission: 'refunds', keywords: ['money back'] },
  { path: '/sales/currency', label: 'Currency Settings', group: 'sales', module: 'sales', permission: 'currency', keywords: ['exchange rate', 'forex', 'display currency', 'conversion'] },

  // ============================ Purchases ============================
  { path: '/purchases/dashboard', label: 'Purchases Dashboard', group: 'purchases', module: 'purchases', permission: 'dashboard', keywords: ['overview'] },
  { path: '/purchases/reports', label: 'Purchase Reports', group: 'purchases', module: 'purchases', permission: 'dashboard', keywords: ['analytics'] },
  { path: '/purchases/products', label: 'Purchase Products', group: 'purchases', module: 'purchases', permission: 'products', keywords: ['items', 'catalog'] },
  { path: '/purchases/requisitions', label: 'Requisitions', group: 'purchases', module: 'purchases', permission: 'requisitions', keywords: ['purchase request', 'pr'] },
  { path: '/purchases/purchaseorder', label: 'Purchase Orders', group: 'purchases', module: 'purchases', permission: 'purchase-orders', keywords: ['po', 'order to supplier'] },
  { path: '/purchases/suppliers', label: 'Suppliers', group: 'purchases', module: 'purchases', permission: 'suppliers', keywords: ['vendors', 'vendor list'] },
  { path: '/purchases/goodsRecieving', label: 'Goods Receiving', group: 'purchases', module: 'purchases', permission: 'goods-receiving', keywords: ['grn', 'receive stock'] },
  { path: '/purchases/receipts', label: 'Purchase Receipts', group: 'purchases', module: 'purchases', permission: 'goods-receiving', keywords: ['grn', 'receiving'] },
  { path: '/purchases/invoices', label: 'Purchase Invoices', group: 'purchases', module: 'purchases', permission: 'purchase-invoices', keywords: ['vendor invoice', 'bill'] },
  { path: '/purchases/payments', label: 'Purchase Payments', group: 'purchases', module: 'purchases', permission: 'purchase-payments', keywords: ['vendor payment', 'cash out'] },
  { path: '/purchases/returns', label: 'Purchase Returns', group: 'purchases', module: 'purchases', permission: 'purchase-returns', keywords: ['return to supplier'] },
  { path: '/purchases/refunds', label: 'Purchase Refunds', group: 'purchases', module: 'purchases', permission: 'refunds', keywords: ['money back'] },
  { path: '/purchases/currency', label: 'Currency Settings', group: 'purchases', module: 'purchases', permission: 'currency', keywords: ['exchange rate', 'forex', 'display currency', 'conversion'] },
  // ============================ Inventory ============================
  { path: '/warehouse/dashboard', label: 'Inventory Dashboard', group: 'warehouse', module: 'warehouse', permission: 'dashboard', keywords: ['overview', 'stock', 'warehouse'] },
  { path: '/warehouse/products', label: 'Inventory Products', group: 'warehouse', module: 'warehouse', permission: 'products', keywords: ['items', 'stock items'] },
  { path: '/warehouse/import', label: 'Import Inventory', group: 'warehouse', module: 'warehouse', permission: 'products', keywords: ['excel', 'csv', 'bulk import', 'opening stock'] },
  { path: '/warehouse/categories', label: 'Categories', group: 'warehouse', module: 'warehouse', permission: 'categories', keywords: ['product groups'] },
  { path: '/warehouse/brands', label: 'Brands', group: 'warehouse', module: 'warehouse', permission: 'products', keywords: ['brand', 'manufacturer', 'label'] },
  { path: '/warehouse/suppliers', label: 'Inventory Suppliers', group: 'warehouse', module: 'warehouse', permission: 'suppliers', keywords: ['vendors'] },
  { path: '/warehouse/customers', label: 'Inventory Customers', group: 'warehouse', module: 'warehouse', permission: 'customers', keywords: ['clients'] },
  { path: '/warehouse/stock-movement', label: 'Stock Movement', group: 'warehouse', module: 'warehouse', permission: 'stock-movement', keywords: ['transfer', 'stock in out', 'adjustment'] },
  { path: '/warehouse/locations', label: 'Warehouses', group: 'warehouse', module: 'warehouse', permission: 'products', adminOnly: true, keywords: ['warehouse', 'godown', 'store', 'locations'] },
  { path: '/warehouse/transfers', label: 'Product Transfer', group: 'warehouse', module: 'warehouse', permission: 'stock-movement', keywords: ['transfer', 'internal', 'move stock'] },
  { path: '/warehouse/inventory-valuation', label: 'Inventory Valuation', group: 'warehouse', module: 'warehouse', permission: 'inventory-valuation', keywords: ['stock value'] },
  { path: '/warehouse/reports', label: 'Inventory Reports', group: 'warehouse', module: 'warehouse', permission: 'reports', keywords: ['all reports'] },
  { path: '/warehouse/reports/stock-summary', label: 'Stock Summary', group: 'warehouse', module: 'warehouse', permission: 'stock-summary', keywords: ['stock report'] },
  { path: '/warehouse/reports/low-stock', label: 'Low Stock Report', group: 'warehouse', module: 'warehouse', permission: 'low-stock', keywords: ['reorder', 'minimum stock'] },
  { path: '/warehouse/reports/expiry', label: 'Expiry Report', group: 'warehouse', module: 'warehouse', permission: 'expiry', keywords: ['expired', 'batch'] },
  { path: '/warehouse/orders', label: 'Inventory Orders', group: 'warehouse', module: 'warehouse', keywords: ['pick', 'pack', 'fulfilment'] },
  { path: '/warehouse/returns', label: 'Inventory Returns', group: 'warehouse', module: 'warehouse', keywords: ['returned goods'] },
  { path: '/warehouse/refunds', label: 'Inventory Refunds', group: 'warehouse', module: 'warehouse', keywords: ['money back'] },
  { path: '/settings/units', label: 'Units of Measure', group: 'settings', module: 'settings', keywords: ['units', 'uom', 'stock unit', 'pcs', 'kg', 'measure'] },
  { path: '/warehouse/product-settings', label: 'Product Settings', group: 'warehouse', module: 'warehouse', permission: 'settings', keywords: ['inventory settings', 'product types', 'racks'] },

  { path: '/manufacturing/manufacturing/manufacturing-settings', label: 'Manufacturing Settings', group: 'manufacturing', module: 'manufacturing', keywords: ['configuration', 'erpnext settings'] },

  // ========================== Manufacturing (ERPNext workspace) ==========================
  { path: '/manufacturing/manufacturing', label: 'Manufacturing Home', group: 'manufacturing', module: 'manufacturing', keywords: ['workspace', 'production home'] },
  { path: '/manufacturing/manufacturing/dashboard', label: 'Manufacturing Dashboard', group: 'manufacturing', module: 'manufacturing', keywords: ['production overview', 'charts'] },
  { path: '/manufacturing/manufacturing/bom', label: 'Bill of Materials', group: 'manufacturing', module: 'manufacturing', keywords: ['bom', 'recipe', 'bill of materials'] },
  { path: '/manufacturing/manufacturing/work-order', label: 'Work Order', group: 'manufacturing', module: 'manufacturing', keywords: ['production order', 'wo', 'manufacturing order'] },
  { path: '/manufacturing/manufacturing/job-card', label: 'Job Card', group: 'manufacturing', module: 'manufacturing', keywords: ['shop floor', 'operation', 'time log'] },
  { path: '/manufacturing/manufacturing/routing', label: 'Routing', group: 'manufacturing', module: 'manufacturing', keywords: ['process route', 'operations sequence'] },
  { path: '/manufacturing/manufacturing/workstation', label: 'Workstation', group: 'manufacturing', module: 'manufacturing', keywords: ['work center', 'machine group'] },
  { path: '/manufacturing/manufacturing/operation', label: 'Operation', group: 'manufacturing', module: 'manufacturing', keywords: ['manufacturing operation'] },
  { path: '/manufacturing/manufacturing/workstation-type', label: 'Workstation Type', group: 'manufacturing', module: 'manufacturing', keywords: ['work center type'] },
  { path: '/manufacturing/manufacturing/plant-floor', label: 'Plant Floor', group: 'manufacturing', module: 'manufacturing', keywords: ['shop floor', 'visual production'] },
  { path: '/manufacturing/manufacturing/production-plan', label: 'Production Plan', group: 'manufacturing', module: 'manufacturing', keywords: ['mrp', 'planning', 'demand'] },
  { path: '/manufacturing/manufacturing/master-production-schedule', label: 'Master Production Schedule', group: 'manufacturing', module: 'manufacturing', keywords: ['mps', 'schedule'] },
  { path: '/manufacturing/manufacturing/downtime-entry', label: 'Downtime Entry', group: 'manufacturing', module: 'manufacturing', keywords: ['maintenance', 'breakdown', 'machine stop'] },
  // =============================== HR (ERPNext workspaces) ===============================
  { path: '/hr/hr-setup', label: 'HR Setup', group: 'hr', module: 'hr', keywords: ['masters', 'company', 'branch', 'employee'] },
  { path: '/hr/hr-setup/employee', label: 'Employee', group: 'hr', module: 'hr', keywords: ['staff', 'employee list'] },
  { path: '/hr/org-chart', label: 'Organizational Chart', group: 'hr', module: 'hr', keywords: ['hierarchy'] },
  { path: '/hr/offices', label: 'Branch', group: 'hr', module: 'hr', keywords: ['branches', 'locations', 'offices'] },
  { path: '/hr/hr-setup/department', label: 'Department', group: 'hr', module: 'hr', keywords: ['organization', 'departments'] },
  { path: '/hr/hr-setup/designation', label: 'Designation', group: 'hr', module: 'hr', keywords: ['job title'] },
  { path: '/hr/tenure', label: 'Tenure', group: 'hr', module: 'hr', keywords: ['onboarding', 'separation', 'grievance'] },
  { path: '/hr/recruitment', label: 'Recruitment', group: 'hr', module: 'hr', keywords: ['job opening', 'applicant', 'offer'] },
  { path: '/hr/shift-and-attendance', label: 'Shift & Attendance', group: 'hr', module: 'hr', keywords: ['checkin', 'shift request', 'roster'] },
  { path: '/hr/roster', label: 'Roster', group: 'hr', module: 'hr', keywords: ['duty roster'] },
  { path: '/hr/attendance', label: 'Attendance', group: 'hr', module: 'hr', keywords: ['check in', 'hours'] },
  { path: '/hr/shift-and-attendance/shift-type', label: 'Shift Type', group: 'hr', module: 'hr', keywords: ['shifts', 'shift timing'] },
  { path: '/hr/shift-and-attendance/shift-schedule', label: 'Shift Schedule', group: 'hr', module: 'hr', keywords: ['recurring shift'] },
  { path: '/hr/leaves', label: 'Leaves', group: 'hr', module: 'hr', keywords: ['time off', 'vacation', 'leave application'] },
  { path: '/hr/leaves/leave-application', label: 'Leave Application', group: 'hr', module: 'hr', keywords: ['apply leave'] },
  { path: '/hr/leaves/holiday-list', label: 'Holiday List', group: 'hr', module: 'hr', keywords: ['holidays', 'public holidays'] },
  { path: '/hr/expenses', label: 'Expenses', group: 'hr', module: 'hr', keywords: ['expense claim', 'advance', 'travel'] },
  { path: '/hr/expenses/travel-request', label: 'Travel Request', group: 'hr', module: 'hr', keywords: ['travel'] },
  { path: '/hr/performance', label: 'Performance', group: 'hr', module: 'hr', keywords: ['appraisal', 'goal', 'kra'] },
  { path: '/hr/tax-and-benefits', label: 'Tax & Benefits', group: 'hr', module: 'hr', keywords: ['exemption', 'benefit claim', 'gratuity'] },
  { path: '/hr/payroll', label: 'Payroll', group: 'hr', module: 'hr', keywords: ['salary', 'payslip'] },
  { path: '/hr/payroll/run', label: 'Payroll Entry', group: 'hr', module: 'hr', keywords: ['calculate', 'salary build'] },
  { path: '/hr/payroll/salary-structure', label: 'Salary Structure', group: 'hr', module: 'hr', keywords: ['basic', 'allowances', 'statutory'] },
  { path: '/hr/payroll/payslips', label: 'Salary Slip', group: 'hr', module: 'hr', keywords: ['payslip', 'print salary'] },
  { path: '/hr/payroll/pay-register', label: 'Salary Register', group: 'hr', module: 'hr', keywords: ['salary register', 'payroll register'] },
  { path: '/hr/settings/payroll', label: 'Payroll Settings', group: 'hr', module: 'hr', keywords: ['salary policy', 'deduction policy'] },
  { path: '/hr/settings', label: 'HR Settings', group: 'hr', module: 'hr', keywords: ['configuration'] },
  // Bisonstechs-only tracking kept discoverable but out of the ERPNext workspace tree
  { path: '/hr/live-tracking', label: 'Live Tracking', group: 'hr', module: 'hr', keywords: ['gps', 'field staff'] },
  // ============================== Tax ===============================
  { path: '/tax', label: 'Tax Overview', group: 'tax', module: 'tax', keywords: ['tax compliance', 'vat', 'gst'] },
  { path: '/tax/setup', label: 'Country & Tax Profile', group: 'tax', module: 'tax', keywords: ['tax setup', 'jurisdiction'] },
  { path: '/tax/rates', label: 'Tax Types, Rates & Rules', group: 'tax', module: 'tax', keywords: ['tax rate', 'vat rate', 'gst rate'] },
  { path: '/tax/exemptions', label: 'Tax Exemptions', group: 'tax', module: 'tax', keywords: ['exempt', 'zero rated'] },
  { path: '/tax/reports', label: 'Tax Liability & Audit', group: 'tax', module: 'tax', keywords: ['tax report', 'audit'] },
  // ============================ Settings ============================
  { path: '/settings/invoice-numbers', label: 'Document Numbering', group: 'settings', module: 'settings', keywords: ['invoice numbers', 'prefix', 'series', 'document numbering'] },
  { path: '/settings/company-info', label: 'Company Info', group: 'settings', module: 'settings', keywords: ['company preferences', 'company profile'] },
  { path: '/settings/stock', label: 'Stock Settings', group: 'settings', module: 'settings', keywords: ['inventory settings', 'negative stock'] },
  { path: '/settings/backup-restore', label: 'Backup & Restore', group: 'settings', module: 'settings', keywords: ['backup', 'restore', 'export data', 'zip'] },
];

// ---------------------------------------------------------------------------
// Search helpers
// ---------------------------------------------------------------------------

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[_\-/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isSubsequence(needle: string, haystack: string): boolean {
  if (!needle) return false;
  let index = 0;
  for (const char of haystack) {
    if (char === needle[index]) index += 1;
    if (index === needle.length) return true;
  }
  return false;
}

/**
 * Relevance score of a single query word for a page. 0 means "no match".
 */
function scoreToken(page: GlobalSearchPage, q: string): number {
  const label = normalize(page.label);
  const path = normalize(page.path);
  const keywords = (page.keywords ?? []).map(normalize);
  const group = normalize(SEARCH_GROUPS[page.group]?.label ?? page.group);

  if (label === q) return 120;
  if (label.startsWith(q)) return 100;
  if (keywords.some((keyword) => keyword === q)) return 95;
  if (label.split(' ').some((word) => word.startsWith(q))) return 85;
  if (keywords.some((keyword) => keyword.startsWith(q))) return 80;
  if (label.includes(q)) return 70;
  if (keywords.some((keyword) => keyword.includes(q))) return 60;
  if (group.includes(q)) return 45;
  if (path.includes(q)) return 40;
  if (isSubsequence(q, label)) return 20;

  return 0;
}

/**
 * Relevance score of a page for a query. 0 means "does not match".
 * Every word of the query must match; higher is better.
 */
export function scoreGlobalSearchPage(
  page: GlobalSearchPage,
  query: string
): number {
  const phrase = normalize(query);
  if (!phrase) return 0;

  const label = normalize(page.label);
  if (label === phrase) return 200;

  const tokens = phrase.split(' ').filter(Boolean);
  let total = 0;

  for (const token of tokens) {
    const tokenScore = scoreToken(page, token);
    if (tokenScore === 0) return 0;
    total += tokenScore;
  }

  return label.startsWith(phrase) ? total + 40 : total;
}

/** Ranked list of pages matching `query` (empty list for an empty query). */
export function searchGlobalPages(
  query: string,
  pages: GlobalSearchPage[] = GLOBAL_SEARCH_PAGES,
  limit = 40
): GlobalSearchPage[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  return pages
    .map((page) => ({ page, score: scoreGlobalSearchPage(page, trimmed) }))
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) => b.score - a.score || a.page.label.localeCompare(b.page.label)
    )
    .slice(0, limit)
    .map((entry) => entry.page);
}


export type GlobalSearchGrouping = {
  key: GlobalSearchGroupKey;
  label: string;
  href: string;
  items: GlobalSearchPage[];
};

/**
 * Groups an already-ranked result list by module, keeping the ranking order
 * both between groups and inside them.
 */
export function groupGlobalSearchResults(
  pages: GlobalSearchPage[]
): GlobalSearchGrouping[] {
  const order: GlobalSearchGroupKey[] = [];
  const buckets = new Map<GlobalSearchGroupKey, GlobalSearchPage[]>();

  pages.forEach((page) => {
    if (!buckets.has(page.group)) {
      buckets.set(page.group, []);
      order.push(page.group);
    }
    buckets.get(page.group)?.push(page);
  });

  return order.map((key) => ({
    key,
    label: SEARCH_GROUPS[key]?.label ?? key,
    href: SEARCH_GROUPS[key]?.href ?? '/dashboard',
    items: buckets.get(key) ?? [],
  }));
}

export type HighlightPart = { text: string; match: boolean };

/** Splits a label into parts so the matched query can be highlighted. */
export function splitHighlight(text: string, query: string): HighlightPart[] {
  const q = query.trim();
  if (!q) return [{ text, match: false }];

  const lower = text.toLowerCase();
  const tokens = q.split(/\s+/).filter(Boolean);

  // Prefer the whole phrase, then the first word that appears in the label.
  const needle =
    tokens.find((token) => lower.includes(token.toLowerCase()))?.toLowerCase() ??
    '';

  if (!needle) return [{ text, match: false }];

  const index = lower.indexOf(needle);
  if (index === -1) return [{ text, match: false }];

  return [
    { text: text.slice(0, index), match: false },
    { text: text.slice(index, index + needle.length), match: true },
    { text: text.slice(index + needle.length), match: false },
  ].filter((part) => part.text.length > 0);
}

