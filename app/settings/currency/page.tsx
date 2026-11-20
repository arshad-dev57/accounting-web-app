'use client';

export const dynamic = 'force-dynamic';

import CurrencySettingsScreen from '@/components/CurrencySettingsScreen';

export function CurrencySettingsPage() {
  return <CurrencySettingsScreen />;
}

export default function CurrencySettingsPageDefault() {
  return <CurrencySettingsPage />;
}
