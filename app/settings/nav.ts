export type SettingsNavItem = {
  href: string;
  label: string;
  iconKey:
    | 'company'
    | 'invoice'
    | 'currency'
    | 'stock'
    | 'donation'
    | 'images'
    | 'account'
    | 'linked'
    | 'units'
    | 'agents'
    | 'categories'
    | 'brands'
    | 'fields'
    | 'backup'
    | 'pdf'
    | 'themes';
};

export const SETTINGS_NAV: SettingsNavItem[] = [
  { href: '/settings/company-info', label: 'Company Info', iconKey: 'company' },
  { href: '/settings/themes', label: 'Themes', iconKey: 'themes' },
  { href: '/settings/invoice-numbers', label: 'Invoice Numbers', iconKey: 'invoice' },
  { href: '/settings/currency', label: 'Currency', iconKey: 'currency' },
  { href: '/settings/pdf-reports', label: 'PDF Reports', iconKey: 'pdf' },
  { href: '/settings/stock', label: 'Stock', iconKey: 'stock' },
  { href: '/settings/donation', label: 'Donation / Charity', iconKey: 'donation' },
  { href: '/settings/images', label: 'Images', iconKey: 'images' },
  { href: '/settings/account', label: 'Account', iconKey: 'account' },
  { href: '/settings/linked-accounts', label: 'Linked Accounts', iconKey: 'linked' },
  { href: '/settings/units', label: 'Units', iconKey: 'units' },
  { href: '/settings/sales-agents', label: 'Sales Agents', iconKey: 'agents' },
  { href: '/settings/categories', label: 'Categories', iconKey: 'categories' },
  { href: '/settings/brands', label: 'Brands', iconKey: 'brands' },
  { href: '/settings/product-fields', label: 'Product Fields', iconKey: 'fields' },
  { href: '/settings/backup-restore', label: 'Backup & Restore', iconKey: 'backup' },
];

/** Shared event so sidebar "Save Settings" can trigger the active page save. */
export const SETTINGS_SAVE_EVENT = 'settings:save';

export function requestSettingsSave() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(SETTINGS_SAVE_EVENT));
}
