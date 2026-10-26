'use client';

export const dynamic = 'force-dynamic';

import CurrencySettingsScreen from '../../../../components/CurrencySettingsScreen';

/** Deep link → unified Currency Settings (Conversion Rates tab). */
export default function CurrencyMasterPage() {
  return <CurrencySettingsScreen initialTab="rates" />;
}

export { CurrencyMasterPage };
