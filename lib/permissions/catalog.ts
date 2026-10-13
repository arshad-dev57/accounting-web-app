/**
 * Frontend Permission Catalog & Types for Bisonstechs ERP
 */

export interface PermissionActionDef {
  action: string;
  name: string;
  description: string;
  supportedScopes: string[];
}

export interface ResourceDef {
  key: string;
  name: string;
  description: string;
  actions: string[];
  scopes: string[];
}

export interface ModuleDef {
  key: string;
  name: string;
  description: string;
  resources: ResourceDef[];
}

export const PERMISSION_MODULES: ModuleDef[] = [
  {
    key: 'sales',
    name: 'Sales',
    description: 'Quotations, orders, invoices, deliveries, customers, and payments',
    resources: [
      {
        key: 'orders',
        name: 'Sales Orders',
        description: 'Customer sales orders and order approvals',
        actions: ['view', 'create', 'edit', 'delete', 'approve', 'cancel', 'print', 'export'],
        scopes: ['ALL', 'OWN', 'TEAM']
      },
      {
        key: 'quotations',
        name: 'Sales Quotations',
        description: 'Price quotes and estimates for customers',
        actions: ['view', 'create', 'edit', 'delete', 'approve', 'cancel', 'print', 'export'],
        scopes: ['ALL', 'OWN', 'TEAM']
      },
      {
        key: 'invoices',
        name: 'Sales Invoices',
        description: 'Customer billing invoices and payment collection',
        actions: ['view', 'create', 'edit', 'delete', 'approve', 'post', 'cancel', 'print', 'export', 'receive'],
        scopes: ['ALL', 'OWN', 'TEAM']
      },
      {
        key: 'customers',
        name: 'Customers',
        description: 'Customer master and accounts',
        actions: ['view', 'create', 'edit', 'delete', 'export'],
        scopes: ['ALL', 'OWN']
      },
      {
        key: 'salespersons',
        name: 'Salespersons & Territories',
        description: 'Salesperson profiles, targets, and commission territories',
        actions: ['view', 'create', 'edit', 'delete', 'export'],
        scopes: ['ALL', 'OWN']
      },
      {
        key: 'deliveries',
        name: 'Sales Deliveries',
        description: 'Delivery orders and dispatch tracking',
        actions: ['view', 'create', 'edit', 'delete', 'approve', 'print', 'export'],
        scopes: ['ALL', 'WAREHOUSE']
      },
      {
        key: 'payments',
        name: 'Sales Payments',
        description: 'Receipt of payments against invoices',
        actions: ['view', 'create', 'edit', 'delete', 'approve', 'print', 'export'],
        scopes: ['ALL', 'OWN']
      },
      {
        key: 'returns',
        name: 'Sales Returns & Refunds',
        description: 'Returned items and customer refunds',
        actions: ['view', 'create', 'edit', 'delete', 'approve', 'print', 'export'],
        scopes: ['ALL', 'OWN', 'WAREHOUSE']
      },
      {
        key: 'credits',
        name: 'Sales Credits & Notes',
        description: 'Credit notes and customer credit applications',
        actions: ['view', 'create', 'edit', 'delete', 'approve', 'void', 'print', 'export'],
        scopes: ['ALL', 'OWN']
      }
    ]
  },
  {
    key: 'purchases',
    name: 'Purchases',
    description: 'Purchase orders, goods receipt notes, vendor bills, and suppliers',
    resources: [
      {
        key: 'orders',
        name: 'Purchase Orders',
        description: 'Purchase orders to suppliers',
        actions: ['view', 'create', 'edit', 'delete', 'approve', 'cancel', 'print', 'export'],
        scopes: ['ALL', 'OWN', 'TEAM']
      },
      {
        key: 'grn',
        name: 'Goods Receiving (GRN)',
        description: 'Goods receiving notes and inbound shipment inspection',
        actions: ['view', 'create', 'edit', 'delete', 'approve', 'cancel', 'print', 'export'],
        scopes: ['ALL', 'WAREHOUSE']
      },
      {
        key: 'invoices',
        name: 'Purchase Invoices / Bills',
        description: 'Supplier invoices, verification, and payment processing',
        actions: ['view', 'create', 'edit', 'delete', 'approve', 'post', 'cancel', 'print', 'export', 'pay'],
        scopes: ['ALL', 'OWN']
      },
      {
        key: 'suppliers',
        name: 'Suppliers / Vendors',
        description: 'Supplier directory and credit terms',
        actions: ['view', 'create', 'edit', 'delete', 'export'],
        scopes: ['ALL']
      },
      {
        key: 'payments',
        name: 'Purchase Payments',
        description: 'Disbursements and payments to suppliers',
        actions: ['view', 'create', 'edit', 'delete', 'approve', 'print', 'export'],
        scopes: ['ALL']
      },
      {
        key: 'returns',
        name: 'Purchase Returns',
        description: 'Debit notes and goods returned to suppliers',
        actions: ['view', 'create', 'edit', 'delete', 'approve', 'print', 'export'],
        scopes: ['ALL', 'WAREHOUSE']
      }
    ]
  },
  {
    key: 'inventory',
    name: 'Inventory & Warehouse',
    description: 'Products, stock levels, transfers, adjustments, and warehouses',
    resources: [
      {
        key: 'products',
        name: 'Products & Items',
        description: 'Product catalog, pricing, barcodes, and units',
        actions: ['view', 'create', 'edit', 'delete', 'export', 'import'],
        scopes: ['ALL']
      },
      {
        key: 'categories',
        name: 'Categories',
        description: 'Product categories and classifications',
        actions: ['view', 'create', 'edit', 'delete', 'export'],
        scopes: ['ALL']
      },
      {
        key: 'warehouses',
        name: 'Warehouses & Locations',
        description: 'Warehouse locations, racks, and stock bins',
        actions: ['view', 'create', 'edit', 'delete'],
        scopes: ['ALL', 'WAREHOUSE']
      },
      {
        key: 'stock',
        name: 'Stock Movements & Tracking',
        description: 'Live inventory balances and movement logs',
        actions: ['view', 'export'],
        scopes: ['ALL', 'WAREHOUSE']
      },
      {
        key: 'transfers',
        name: 'Stock Transfers',
        description: 'Inter-warehouse stock movements and dispatches',
        actions: ['view', 'create', 'edit', 'delete', 'approve', 'cancel', 'print', 'export'],
        scopes: ['ALL', 'WAREHOUSE']
      },
      {
        key: 'adjustments',
        name: 'Stock Adjustments & Counts',
        description: 'Physical inventory reconciliation and cycle counts',
        actions: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
        scopes: ['ALL', 'WAREHOUSE']
      },
      {
        key: 'write_offs',
        name: 'Stock Write-Offs & Damaged Goods',
        description: 'Scrap, expired, and damaged inventory disposal',
        actions: ['view', 'create', 'edit', 'delete', 'approve', 'post', 'export'],
        scopes: ['ALL', 'WAREHOUSE']
      }
    ]
  },
  {
    key: 'accounting',
    name: 'Accounting & Finance',
    description: 'General ledger, journal entries, banking, capital, and financial statements',
    resources: [
      {
        key: 'chart_of_accounts',
        name: 'Chart of Accounts',
        description: 'Account hierarchy, asset/liability/equity/revenue/expense master',
        actions: ['view', 'create', 'edit', 'delete', 'export'],
        scopes: ['ALL']
      },
      {
        key: 'journal_entries',
        name: 'Journal Entries',
        description: 'General journal entries, debits/credits, and posting',
        actions: ['view', 'create', 'edit', 'delete', 'post', 'reverse', 'print', 'export'],
        scopes: ['ALL', 'OWN']
      },
      {
        key: 'general_ledger',
        name: 'General Ledger',
        description: 'Detailed general ledger by account and period',
        actions: ['view', 'print', 'export'],
        scopes: ['ALL']
      },
      {
        key: 'trial_balance',
        name: 'Trial Balance',
        description: 'Summary and detailed trial balance',
        actions: ['view', 'print', 'export'],
        scopes: ['ALL']
      },
      {
        key: 'bank_accounts',
        name: 'Bank & Cash Accounts',
        description: 'Cash in hand, bank accounts, and card settlement registers',
        actions: ['view', 'create', 'edit', 'delete', 'export'],
        scopes: ['ALL']
      },
      {
        key: 'bank_reconciliation',
        name: 'Bank Reconciliation',
        description: 'Bank statement import, matching, and reconciliation closing',
        actions: ['view', 'create', 'edit', 'delete', 'approve', 'close', 'reopen', 'export'],
        scopes: ['ALL']
      },
      {
        key: 'expenses',
        name: 'Operating Expenses',
        description: 'Business expenses, petty cash disbursements, and vendor payments',
        actions: ['view', 'create', 'edit', 'delete', 'approve', 'post', 'print', 'export'],
        scopes: ['ALL', 'OWN', 'DEPARTMENT']
      },
      {
        key: 'income',
        name: 'Direct & Other Income',
        description: 'Non-sales revenue, interest, and other receipts',
        actions: ['view', 'create', 'edit', 'delete', 'post', 'export'],
        scopes: ['ALL', 'OWN']
      },
      {
        key: 'cost_centers',
        name: 'Cost Centers & Dimensions',
        description: 'Cost centers, project tags, and department budgeting',
        actions: ['view', 'create', 'edit', 'delete'],
        scopes: ['ALL']
      },
      {
        key: 'budgets',
        name: 'Budgets & Budget vs Actual',
        description: 'Departmental budgeting and variance analysis',
        actions: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
        scopes: ['ALL', 'DEPARTMENT']
      },
      {
        key: 'capital_equity',
        name: 'Capital & Equity Management',
        description: 'Partner/owner capital, drawings, dividends, and reserves',
        actions: ['view', 'create', 'post', 'transfer', 'export'],
        scopes: ['ALL']
      },
      {
        key: 'fixed_assets',
        name: 'Fixed Assets & Depreciation',
        description: 'Fixed asset registers, depreciation schedules, and disposals',
        actions: ['view', 'create', 'edit', 'delete', 'post', 'export'],
        scopes: ['ALL']
      },
      {
        key: 'loans',
        name: 'Loans & Borrowings',
        description: 'Bank loans, financing, interest schedules, and repayments',
        actions: ['view', 'create', 'edit', 'delete', 'post', 'export'],
        scopes: ['ALL']
      },
      {
        key: 'fiscal_years',
        name: 'Fiscal Years & Periods',
        description: 'Accounting calendar, period closing, and year-end closing',
        actions: ['view', 'create', 'close', 'reopen'],
        scopes: ['ALL']
      }
    ]
  },
  {
    key: 'pos',
    name: 'Point of Sale (POS)',
    description: 'Cashier checkout counters, shifts, receipts, and kitchen display',
    resources: [
      {
        key: 'register',
        name: 'POS Register / Checkout',
        description: 'Selling items, scanning barcodes, collecting cash/card',
        actions: ['view', 'create', 'edit', 'cancel', 'print'],
        scopes: ['ALL', 'OWN', 'WAREHOUSE']
      },
      {
        key: 'shifts',
        name: 'Cashier Shifts & Floats',
        description: 'Opening balance float, cash drop, and shift closing',
        actions: ['view', 'create', 'close', 'reopen', 'print', 'export'],
        scopes: ['ALL', 'OWN', 'WAREHOUSE']
      },
      {
        key: 'terminals',
        name: 'POS Terminals',
        description: 'Terminal hardware profiles and location assignment',
        actions: ['view', 'create', 'edit', 'delete'],
        scopes: ['ALL', 'WAREHOUSE']
      }
    ]
  },
  {
    key: 'hr',
    name: 'HR & Payroll',
    description: 'Employee profiles, salary, attendance, payroll runs, and departments',
    resources: [
      {
        key: 'employees',
        name: 'Employees Directory',
        description: 'Employee biographical, contact, and job information',
        actions: ['view', 'create', 'edit', 'delete', 'export'],
        scopes: ['ALL', 'DEPARTMENT', 'BRANCH']
      },
      {
        key: 'salary',
        name: 'Salary & Compensation',
        description: 'Base salary, allowances, deductions, and bank details',
        actions: ['view', 'edit'],
        scopes: ['ALL']
      },
      {
        key: 'attendance',
        name: 'Attendance & Time Tracking',
        description: 'Daily check-in/out, biometric logs, and leaves',
        actions: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
        scopes: ['ALL', 'OWN', 'DEPARTMENT']
      },
      {
        key: 'payroll',
        name: 'Payroll Processing',
        description: 'Monthly payroll generation, payslips, and disbursements',
        actions: ['view', 'create', 'edit', 'approve', 'post', 'print', 'export', 'pay'],
        scopes: ['ALL', 'DEPARTMENT']
      },
      {
        key: 'departments',
        name: 'Departments & Offices',
        description: 'Organizational chart, departments, and branch offices',
        actions: ['view', 'create', 'edit', 'delete'],
        scopes: ['ALL']
      }
    ]
  },
  {
    key: 'manufacturing',
    name: 'Manufacturing & MRP',
    description: 'Bills of Materials, production orders, and work centers',
    resources: [
      {
        key: 'bom',
        name: 'Bill of Materials (BOM)',
        description: 'Product recipes, raw material consumption, and routing',
        actions: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
        scopes: ['ALL']
      },
      {
        key: 'orders',
        name: 'Manufacturing Orders',
        description: 'Production jobs, material issue, and finished goods receipt',
        actions: ['view', 'create', 'edit', 'delete', 'approve', 'close', 'cancel', 'print', 'export'],
        scopes: ['ALL', 'WAREHOUSE']
      },
      {
        key: 'work_centers',
        name: 'Work Centers & Machines',
        description: 'Manufacturing stations, capacities, and hourly overhead costs',
        actions: ['view', 'create', 'edit', 'delete'],
        scopes: ['ALL']
      }
    ]
  },
  {
    key: 'reports',
    name: 'Reports & Analytics',
    description: 'Financial, operational, tax, inventory, and management reports',
    resources: [
      {
        key: 'financial',
        name: 'Financial Reports (P&L, Balance Sheet, Cash Flow)',
        description: 'Profit and loss statements, balance sheet, and statement of cash flows',
        actions: ['view', 'print', 'export'],
        scopes: ['ALL']
      },
      {
        key: 'sales',
        name: 'Sales Reports & Aging',
        description: 'Sales summaries, customer aging, territory performance',
        actions: ['view', 'print', 'export'],
        scopes: ['ALL', 'OWN', 'TEAM']
      },
      {
        key: 'purchases',
        name: 'Purchase & Vendor Reports',
        description: 'Vendor aging, procurement summaries, spend by supplier',
        actions: ['view', 'print', 'export'],
        scopes: ['ALL']
      },
      {
        key: 'inventory',
        name: 'Inventory & Valuation Reports',
        description: 'Stock valuation, fast/slow moving items, reorder alerts',
        actions: ['view', 'print', 'export'],
        scopes: ['ALL', 'WAREHOUSE']
      },
      {
        key: 'tax',
        name: 'Tax & Compliance Reports',
        description: 'Sales tax output, purchase tax input, and withholding ledgers',
        actions: ['view', 'print', 'export'],
        scopes: ['ALL']
      },
      {
        key: 'hr',
        name: 'HR & Payroll Reports',
        description: 'Salary register, attendance summaries, headcounts',
        actions: ['view', 'print', 'export'],
        scopes: ['ALL']
      }
    ]
  },
  {
    key: 'dashboard',
    name: 'Dashboard & Widgets',
    description: 'Executive overview and individual KPI widget visibility',
    resources: [
      {
        key: 'overview',
        name: 'Executive Dashboard View',
        description: 'Ability to access and view executive business dashboards',
        actions: ['view'],
        scopes: ['ALL']
      },
      {
        key: 'widgets_sales',
        name: 'Sales Summary & Charts',
        description: 'Sales revenue, order volume, and sales trajectory charts',
        actions: ['view'],
        scopes: ['ALL', 'OWN']
      },
      {
        key: 'widgets_purchases',
        name: 'Purchases & Vendor Summary',
        description: 'Total purchases, open POs, and purchase charts',
        actions: ['view'],
        scopes: ['ALL']
      },
      {
        key: 'widgets_financial',
        name: 'Revenue, Expenses & Profit',
        description: 'Gross profit, operating expenses, and net profit margins',
        actions: ['view'],
        scopes: ['ALL']
      },
      {
        key: 'widgets_cash_bank',
        name: 'Cash & Bank Balances',
        description: 'Live cash-in-hand and bank account balances',
        actions: ['view'],
        scopes: ['ALL']
      },
      {
        key: 'widgets_ar_ap',
        name: 'Accounts Receivable & Payable',
        description: 'Pending collections from customers and payables to vendors',
        actions: ['view'],
        scopes: ['ALL']
      },
      {
        key: 'widgets_inventory',
        name: 'Inventory Valuation & Low Stock',
        description: 'Total inventory asset value and low stock alerts',
        actions: ['view'],
        scopes: ['ALL', 'WAREHOUSE']
      },
      {
        key: 'widgets_capital',
        name: 'Capital & Equity Summary',
        description: 'Total equity, retained earnings, and partner capital summary',
        actions: ['view'],
        scopes: ['ALL']
      }
    ]
  },
  {
    key: 'settings',
    name: 'Settings & Administration',
    description: 'Company settings, users, roles, permissions, and audit logs',
    resources: [
      {
        key: 'company',
        name: 'Company Profile & Preferences',
        description: 'Company information, tax numbers, logo, and currencies',
        actions: ['view', 'edit'],
        scopes: ['ALL']
      },
      {
        key: 'users',
        name: 'User Management',
        description: 'Inviting users, assigning roles, and managing credentials',
        actions: ['view', 'create', 'edit', 'delete'],
        scopes: ['ALL']
      },
      {
        key: 'roles',
        name: 'Roles & Permissions',
        description: 'Custom roles, permission matrix assignment, and user overrides',
        actions: ['view', 'create', 'edit', 'delete'],
        scopes: ['ALL']
      },
      {
        key: 'audit_logs',
        name: 'Security & Audit Logs',
        description: 'System-wide activity logs, role changes, and authorization events',
        actions: ['view', 'export'],
        scopes: ['ALL']
      }
    ]
  }
];
