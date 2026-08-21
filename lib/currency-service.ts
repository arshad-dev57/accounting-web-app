'use client';

export type AppCurrency = {
  code: string;
  symbol: string;
  name: string;
  symbolNative?: string;
  countryCode?: string;
};

export const CURRENCY_STORAGE_KEY = 'sales_selected_currency';
export const CURRENCY_CODE_KEY = 'app_currency_code';
export const CURRENCY_SYMBOL_KEY = 'app_currency_symbol';
export const DEFAULT_CURRENCY_CODE = 'USD';
export const DEFAULT_CURRENCY_SYMBOL = '$';

export const FAVORITE_CURRENCY_CODES = ['USD', 'EUR', 'GBP', 'PKR', 'SAR', 'AED'] as const;

export const APP_CURRENCIES: AppCurrency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'PKR', symbol: 'Rs', name: 'Pakistani Rupee' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
  { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
  { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee' },
  { code: 'NPR', symbol: 'Rs', name: 'Nepalese Rupee' },
  { code: 'QAR', symbol: 'QR', name: 'Qatari Riyal' },
  { code: 'KWD', symbol: 'KD', name: 'Kuwaiti Dinar' },
  { code: 'OMR', symbol: 'OMR', name: 'Omani Rial' },
  { code: 'BHD', symbol: 'BD', name: 'Bahraini Dinar' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krona' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
];

export function findCurrencyByCode(code: string): AppCurrency | undefined {
  return APP_CURRENCIES.find((c) => c.code === code);
}

function authHeaders(): HeadersInit {
  const token =
    (typeof window !== 'undefined' && localStorage.getItem('auth_token')) || '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** Persist currency locally (Flutter SharedPreferences + sales_selected_currency) */
export function saveCurrencyLocal(currency: {
  code: string;
  symbol: string;
  name?: string;
  symbolNative?: string;
  countryCode?: string;
}): void {
  if (typeof window === 'undefined') return;

  const code = currency.code;
  const symbol = currency.symbol;
  const name = currency.name || findCurrencyByCode(code)?.name || code;

  localStorage.setItem(CURRENCY_CODE_KEY, code);
  localStorage.setItem(CURRENCY_SYMBOL_KEY, symbol);
  localStorage.setItem(
    CURRENCY_STORAGE_KEY,
    JSON.stringify({
      code,
      name,
      symbol,
      symbolNative: currency.symbolNative || symbol,
      countryCode: currency.countryCode,
    })
  );

  // Keep user.businessDetails in sync for permission / profile consumers
  try {
    const raw = localStorage.getItem('user');
    if (raw) {
      const user = JSON.parse(raw);
      user.businessDetails = {
        ...(user.businessDetails || {}),
        currencyCode: code,
        currencySymbol: symbol,
      };
      localStorage.setItem('user', JSON.stringify(user));
    }
  } catch {
    /* ignore */
  }

  // Notify other tabs / listeners
  window.dispatchEvent(
    new CustomEvent('app-currency-changed', {
      detail: { code, symbol, name },
    })
  );
}

export function loadCurrencyLocal(): AppCurrency {
  if (typeof window === 'undefined') {
    return {
      code: DEFAULT_CURRENCY_CODE,
      symbol: DEFAULT_CURRENCY_SYMBOL,
      name: 'US Dollar',
    };
  }

  try {
    const saved = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.code && parsed?.symbol) {
        return {
          code: parsed.code,
          symbol: parsed.symbol,
          name: parsed.name || findCurrencyByCode(parsed.code)?.name || parsed.code,
          symbolNative: parsed.symbolNative,
          countryCode: parsed.countryCode,
        };
      }
    }

    const code = localStorage.getItem(CURRENCY_CODE_KEY);
    const symbol = localStorage.getItem(CURRENCY_SYMBOL_KEY);
    if (code && symbol) {
      return {
        code,
        symbol,
        name: findCurrencyByCode(code)?.name || code,
      };
    }

    const userRaw = localStorage.getItem('user');
    if (userRaw) {
      const user = JSON.parse(userRaw);
      const bd = user?.businessDetails;
      if (bd?.currencyCode && bd?.currencySymbol) {
        const loaded = {
          code: String(bd.currencyCode),
          symbol: String(bd.currencySymbol),
          name: findCurrencyByCode(String(bd.currencyCode))?.name || String(bd.currencyCode),
        };
        saveCurrencyLocal(loaded);
        return loaded;
      }
    }
  } catch {
    /* ignore */
  }

  return {
    code: DEFAULT_CURRENCY_CODE,
    symbol: DEFAULT_CURRENCY_SYMBOL,
    name: 'US Dollar',
  };
}

/** Flutter updateFromUserData — apply currency from login/register user payload */
export function updateCurrencyFromUserData(userData: Record<string, unknown> | null | undefined): void {
  if (!userData) return;
  const bd = userData.businessDetails as Record<string, unknown> | undefined;
  if (!bd) return;

  const code = bd.currencyCode ? String(bd.currencyCode) : '';
  const symbol = bd.currencySymbol ? String(bd.currencySymbol) : '';
  if (!code || !symbol) return;

  saveCurrencyLocal({
    code,
    symbol,
    name: findCurrencyByCode(code)?.name || code,
  });
}

/**
 * Select currency: save local first, then PUT /api/users/currency (Flutter setCurrency)
 */
export async function setCurrency(currency: {
  code: string;
  symbol: string;
  name?: string;
  symbolNative?: string;
  countryCode?: string;
}): Promise<{ success: boolean; message?: string }> {
  const resolvedSymbol =
    currency.symbol ||
    findCurrencyByCode(currency.code)?.symbol ||
    '';

  if (!currency.code || !resolvedSymbol) {
    return { success: false, message: 'Invalid currency' };
  }

  saveCurrencyLocal({
    ...currency,
    symbol: resolvedSymbol,
  });

  try {
    const response = await fetch('/api/users/currency', {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({
        currencyCode: currency.code,
        currencySymbol: resolvedSymbol,
      }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        message: result.message || 'Failed to sync currency with server',
      };
    }

    return { success: true, message: result.message || 'Currency updated' };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : 'Network error syncing currency',
    };
  }
}

export function formatAmount(amount: number, opts?: { decimals?: number }): string {
  const { symbol } = loadCurrencyLocal();
  const decimals = opts?.decimals ?? 2;
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount || 0);
  return `${symbol} ${formatted}`;
}

export function formatAmountCompact(amount: number): string {
  const { symbol } = loadCurrencyLocal();
  const abs = Math.abs(amount || 0);
  if (abs >= 10_000_000) return `${symbol} ${(amount / 10_000_000).toFixed(1)}Cr`;
  if (abs >= 100_000) return `${symbol} ${(amount / 100_000).toFixed(1)}L`;
  if (abs >= 1_000) return `${symbol} ${(amount / 1_000).toFixed(0)}K`;
  return `${symbol} ${Math.round(amount || 0)}`;
}
