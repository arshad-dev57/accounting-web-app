'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

export type Crumb = { label: string; href?: string };

const MODULES: Record<string, { label: string; href: string }> = {
  accounting: { label: 'Accounting', href: '/accounting/dashboard' },
  sales: { label: 'Sales', href: '/sales/dashboard' },
  purchases: { label: 'Purchases', href: '/purchases/dashboard' },
  warehouse: { label: 'Warehouse', href: '/warehouse/dashboard' },
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
  locations: 'Locations',
  accounts: 'Chart of Accounts',
  'general-ledger': 'General Ledger',
  'profit-loss': 'Profit & Loss',
  'balance-sheet': 'Balance Sheet',
  bills: 'Bills',
  'payments-received': 'Payments Received',
  'credit-notes': 'Credit Notes',
  'fiscal-years': 'Fiscal Years',
  journal: 'Journal',
  expenses: 'Expenses',
  income: 'Income',
  setup: 'Setup',
  rates: 'Rates',
  exemptions: 'Exemptions',
  management: 'Management',
  settings: 'Settings',
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
