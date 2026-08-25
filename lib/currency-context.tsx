'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  CURRENCY_CODE_KEY,
  CURRENCY_STORAGE_KEY,
  DEFAULT_CURRENCY_CODE,
  DEFAULT_CURRENCY_SYMBOL,
  loadCurrencyLocal,
  setCurrency as persistAndSyncCurrency,
  type AppCurrency,
} from './currency-service';

type CurrencyContextValue = {
  currency: AppCurrency;
  code: string;
  symbol: string;
  formatAmount: (amount: number, opts?: { decimals?: number }) => string;
  formatCompact: (amount: number) => string;
  applyCurrency: (currency: AppCurrency) => Promise<{ success: boolean; message?: string }>;
  refresh: () => void;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function formatWithSymbol(symbol: string, amount: number, decimals = 2) {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number(amount) || 0);
  return `${symbol} ${formatted}`;
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<AppCurrency>({
    code: DEFAULT_CURRENCY_CODE,
    symbol: DEFAULT_CURRENCY_SYMBOL,
    name: 'US Dollar',
  });

  const refresh = useCallback(() => {
    setCurrencyState(loadCurrencyLocal());
  }, []);

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener('app-currency-changed', onChange);
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === CURRENCY_STORAGE_KEY ||
        e.key === CURRENCY_CODE_KEY ||
        e.key === 'user'
      ) {
        refresh();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('app-currency-changed', onChange);
      window.removeEventListener('storage', onStorage);
    };
  }, [refresh]);

  const applyCurrency = useCallback(async (next: AppCurrency) => {
    const result = await persistAndSyncCurrency(next);
    refresh();
    return result;
  }, [refresh]);

  const value = useMemo<CurrencyContextValue>(() => {
    const symbol = currency.symbol || DEFAULT_CURRENCY_SYMBOL;
    return {
      currency,
      code: currency.code,
      symbol,
      formatAmount: (amount, opts) => formatWithSymbol(symbol, amount, opts?.decimals ?? 2),
      formatCompact: (amount) => {
        const abs = Math.abs(amount || 0);
        if (abs >= 10_000_000) return `${symbol} ${(amount / 10_000_000).toFixed(1)}Cr`;
        if (abs >= 100_000) return `${symbol} ${(amount / 100_000).toFixed(1)}L`;
        if (abs >= 1_000) return `${symbol} ${(amount / 1_000).toFixed(0)}K`;
        return `${symbol} ${Math.round(amount || 0)}`;
      },
      applyCurrency,
      refresh,
    };
  }, [currency, applyCurrency, refresh]);

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (ctx) return ctx;

  const fallback = loadCurrencyLocal();
  const symbol = fallback.symbol || DEFAULT_CURRENCY_SYMBOL;
  return {
    currency: fallback,
    code: fallback.code,
    symbol,
    formatAmount: (amount, opts) => formatWithSymbol(symbol, amount, opts?.decimals ?? 2),
    formatCompact: (amount) => formatWithSymbol(symbol, amount, 0),
    applyCurrency: persistAndSyncCurrency,
    refresh: () => {},
  };
}
