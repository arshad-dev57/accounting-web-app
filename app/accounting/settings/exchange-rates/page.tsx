'use client';

export const dynamic = 'force-dynamic';

import CurrencySettingsScreen from '../../../../components/CurrencySettingsScreen';

/** Deep link → unified Currency Settings (Conversion Rates tab). */
export default function ExchangeRatesPage() {
  return <CurrencySettingsScreen initialTab="rates" />;
}

export { ExchangeRatesPage };
