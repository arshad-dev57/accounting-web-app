'use client';

export const dynamic = 'force-dynamic';

import CurrencySettingsScreen from '../../../components/CurrencySettingsScreen';

export function SalesCurrencyPage() {
  return <CurrencySettingsScreen />;
}

/** Next.js route shell — real UI mounts via SalesViewHost. */
export default function SalesRoutePlaceholder() {
  return null;
}
