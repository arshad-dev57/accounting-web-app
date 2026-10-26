'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

export type Crumb = { label: string; href?: string };

const MODULES: Record<string, { label: string; href: string }> = {
  accounting: { label: 'Accounting', href: '/accounting/dashboard' },
  sales: { label: 'Sales', href: '/sales/dashboard' },
  purchases: { label: 'Purchases', href: '/purchases/dashboard' },
  warehouse: { label: 'Inventory', href: '/warehouse/dashboard' },
  manufacturing: { label: 'Manufacturing', href: '/manufacturing/dashboard' },
  import: { label: 'Import Management', href: '/import/dashboard' },
  export: { label: 'Export Management', href: '/export/dashboard' },
  trading: { label: 'Trading Management', href: '/trading/dashboard' },
  tax: { label: 'Tax', href: '/tax' },
  pos: { label: 'POS', href: '/pos' },
  users: { label: 'Users', href: '/users' },
  'registered-users': { label: 'Registered Users', href: '/registered-users' },
};

const PAGE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  reports: 'Reports',
  products: 'Products',
  purchaseorder: 'Purchase Orders',
  requisitions: 'Requisitions',
  suppliers: 'Suppliers',
  quotations: 'Quotations',
  goodsRecieving: 'Goods Receiving',
  invoices: 'Invoices',
  payments: 'Payments',
  returns: 'Returns',
  refunds: 'Refunds',
  orders: 'Orders',
  customers: 'Customers',
  'sales-payment': 'Sales Payments',
  deliveries: 'Deliveries',
  inventory: 'Inventory',
  locations: 'Warehouses',
  transfers: 'Product Transfer',
  accounts: 'Chart of Accounts',
  'general-ledger': 'General Ledger',
  'profit-loss': 'Profit & Loss',
  'balance-sheet': 'Balance Sheet',
  bills: 'Bills',
  'payments-received': 'Payments Received',
  'credit-notes': 'Credit Notes',
  'fiscal-years': 'Fiscal Years',
  currencies: 'Currency',
  'exchange-rates': 'Currency',
  journal: 'Journal',
  expenses: 'Expenses',
  income: 'Income',
  setup: 'Setup',
  rates: 'Rates',
  exemptions: 'Exemptions',
  management: 'Management',
  settings: 'Settings',
  bom: 'Bill of Materials',
  machines: 'Machines',
  'work-centers': 'Work Centers',
  operations: 'Operations',
  routings: 'Routings',
  'bom-versions': 'BOM Versions',
  'work-orders': 'Work Orders',
  'shop-floor': 'Shop Floor',
  tracking: 'Production Tracking',
  reservations: 'Material Reservations',
  issues: 'Material Issues',
  consumption: 'Material Consumption',
  wip: 'WIP',
  scrap: 'Scrap',
  byproducts: 'By-products',
  plans: 'Inspection Plans',
  inspections: 'Quality Inspections',
  defects: 'Defects',
  rework: 'Rework',
  requests: 'Maintenance Requests',
  preventive: 'Preventive Maintenance',
  breakdown: 'Breakdown',
  'spare-parts': 'Spare Parts',
  vendors: 'Subcontract Vendors',
  mrp: 'MRP',
  mps: 'MPS',
  demand: 'Demand Planning',
  shortage: 'Material Shortage',
  'product-cost': 'Product Cost',
  costing: 'Costing',
  'standard-cost': 'Standard Cost',
  'actual-cost': 'Actual Cost',
  variance: 'Cost Variance',
  rfqs: 'RFQs & Quotations',
  approvals: 'Approvals',
  'purchase-orders': 'Purchase Orders',
  'proforma-invoices': 'Proforma Invoices',
  shipments: 'Shipments & Tracking',
  customs: 'Customs & Clearance',
  documents: 'Trade Documents',
  grn: 'Goods Receiving (GRN)',
  'landed-costs': 'Landed Cost Allocation',
  finance: 'Finance & LC Tracking',
  inquiries: 'Export Inquiries',
  packing: 'Packing & Inspection',
  dispatch: 'Dispatch & Port Gate-In',
  receipts: 'Receipts & Settlement',
  'supplier-quotations': 'Supplier Quotations',
  requisitions: 'Purchase Requisitions',
  'goods-receiving': 'Goods Receiving',
  'sales-quotations': 'Sales Quotations',
  'sales-orders': 'Sales Orders',
  'customer-orders': 'Customer Orders',
  customers: 'Customers',
  salespersons: 'Salespersons',
  'sales-products': 'Sales Products',
  'sales-payments': 'Sales Payments',
  'sales-refunds': 'Sales Refunds',
  'sales-reports': 'Sales Reports',
  'purchase-invoices': 'Purchase Invoices',
  'purchase-payments': 'Purchase Payments',
  'purchase-products': 'Purchase Products',
  'purchase-refunds': 'Purchase Refunds',
  'purchase-reports': 'Purchase Reports',
  suppliers: 'Suppliers',
  stock: 'Stock / Products',
  'price-lists': 'Price Lists',
  'customer-pricing': 'Customer Pricing',
  margins: 'Trading Margins',
  'sales-returns': 'Sales Returns',
  'purchase-returns': 'Purchase Returns',
  'purchase-orders': 'Purchase Orders',
  currency: 'Currency',
};

function titleCase(segment: string) {
  return decodeURIComponent(segment)
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function crumbsFromPath(pathname: string, extra: Crumb[] = []): Crumb[] {
  const parts = pathname.split('/').filter(Boolean);
  const crumbs: Crumb[] = [{ label: 'Modules', href: '/dashboard' }];
  if (parts.length === 0 || (parts.length === 1 && parts[0] === 'dashboard')) {
    return [{ label: 'Modules' }];
  }

  const moduleKey = parts[0];
  const module = MODULES[moduleKey];
  if (module) {
    const rest = parts.slice(1);
    const isModuleHome =
      rest.length === 0 ||
      (rest.length === 1 && (rest[0] === 'dashboard' || pathname === module.href));
    crumbs.push({
      label: module.label,
      href: isModuleHome && extra.length === 0 ? undefined : module.href,
    });
    if (rest.length > 0 && !(rest.length === 1 && rest[0] === 'dashboard')) {
      const pageKey = rest[rest.length - 1];
      crumbs.push({
        label: PAGE_LABELS[pageKey] || titleCase(pageKey),
      });
    } else if (rest.length === 1 && rest[0] === 'dashboard') {
      crumbs.push({ label: 'Dashboard' });
    }
  } else {
    crumbs.push({ label: PAGE_LABELS[moduleKey] || titleCase(moduleKey) });
  }

  extra.forEach((item) => crumbs.push(item));
  return crumbs;
}

export default function AppBreadcrumbs({
  items,
  extra,
  variant = 'light',
  className = '',
}: {
  items?: Crumb[];
  extra?: Crumb[];
  variant?: 'light' | 'dark';
  className?: string;
}) {
  const pathname = usePathname() || '/';
  const crumbs = items ?? crumbsFromPath(pathname, extra);
  if (!crumbs.length) return null;

  const dark = variant === 'dark';

  return (
    <nav
      aria-label="Breadcrumb"
      className={`${
        dark
          ? 'bg-[#01366a] text-white/80 border-t border-white/10'
          : 'bg-white border-b border-gray-100'
      } px-4 md:px-6 py-2 ${className}`}
    >
      <ol className="flex items-center flex-wrap gap-1 text-xs md:text-sm min-w-0">
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={`${crumb.label}-${i}`} className="flex items-center gap-1 min-w-0">
              {i === 0 && (
                <Home
                  className={`w-3.5 h-3.5 flex-shrink-0 ${dark ? 'text-white/70' : 'text-[#014582]'}`}
                />
              )}
              {i > 0 && (
                <ChevronRight
                  className={`w-3.5 h-3.5 flex-shrink-0 ${dark ? 'text-white/40' : 'text-gray-400'}`}
                />
              )}
              {crumb.href && !last ? (
                <Link
                  href={crumb.href}
                  className={`truncate font-medium hover:underline ${
                    dark ? 'text-white/80 hover:text-white' : 'text-[#014582] hover:text-[#01366a]'
                  }`}
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  className={`truncate font-semibold ${
                    dark ? 'text-white' : 'text-gray-800'
                  }`}
                >
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
