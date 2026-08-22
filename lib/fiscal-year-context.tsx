'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  FiscalYear,
  FISCAL_YEAR_STORAGE_KEY,
  FISCAL_YEARS_CACHE_EVENT,
  fiscalYearService,
  getCachedFiscalYears,
  getStoredFiscalYearId,
  setStoredFiscalYearId,
} from './fiscal-year-service';

interface FiscalYearContextValue {
  fiscalYears: FiscalYear[];
  selectedFiscalYear: FiscalYear | null;
  selectedFiscalYearId: string;
  loading: boolean;
  error: string;
  setSelectedFiscalYearId: (id: string) => void;
  refresh: () => Promise<void>;
}

const FiscalYearContext = createContext<FiscalYearContextValue | null>(null);

function pickDefault(years: FiscalYear[], preferredId: string | null): FiscalYear | null {
  if (!years.length) return null;
  if (preferredId) {
    const match = years.find((y) => y.id === preferredId);
    if (match) return match;
  }
  return years.find((y) => String(y.status).toLowerCase() === 'open') || years[0];
}

function applyFiscalSelection(years: FiscalYear[], setSelectedId: (id: string) => void) {
  const stored = getStoredFiscalYearId();
  const chosen = pickDefault(years, stored);
  const id = chosen?.id || '';
  setSelectedId(id);
  setStoredFiscalYearId(id || null);
}

export function FiscalYearProvider({ children }: { children: React.ReactNode }) {
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>(() =>
    typeof window === 'undefined' ? [] : getCachedFiscalYears()
  );
  const [selectedFiscalYearId, setSelectedId] = useState(() =>
    typeof window === 'undefined' ? '' : getStoredFiscalYearId() || ''
  );
  const [loading, setLoading] = useState(
    () => (typeof window === 'undefined' ? true : getCachedFiscalYears().length === 0)
  );
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setError('');
    try {
      const years = await fiscalYearService.list();
      setFiscalYears(years);
      applyFiscalSelection(years, setSelectedId);
    } catch (e: any) {
      setError(e?.message || 'Failed to load fiscal years');
      const cached = getCachedFiscalYears();
      if (cached.length) setFiscalYears(cached);
      else setFiscalYears([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const cached = getCachedFiscalYears();
    if (cached.length) {
      setFiscalYears(cached);
      applyFiscalSelection(cached, setSelectedId);
      setLoading(false);
      return;
    }
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onCache = () => {
      const years = getCachedFiscalYears();
      setFiscalYears(years);
      applyFiscalSelection(years, setSelectedId);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === FISCAL_YEAR_STORAGE_KEY && e.newValue) {
        setSelectedId(e.newValue);
      }
      if (e.key === 'cached_fiscal_years') onCache();
    };
    window.addEventListener(FISCAL_YEARS_CACHE_EVENT, onCache);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(FISCAL_YEARS_CACHE_EVENT, onCache);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const setSelectedFiscalYearId = useCallback((id: string) => {
    setSelectedId(id);
    setStoredFiscalYearId(id || null);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('fiscal-year-changed', { detail: { id } }));
    }
  }, []);

  const selectedFiscalYear = useMemo(
    () => fiscalYears.find((y) => y.id === selectedFiscalYearId) || null,
    [fiscalYears, selectedFiscalYearId]
  );

  const value = useMemo(
    () => ({
      fiscalYears,
      selectedFiscalYear,
      selectedFiscalYearId,
      loading,
      error,
      setSelectedFiscalYearId,
      refresh,
    }),
    [
      fiscalYears,
      selectedFiscalYear,
      selectedFiscalYearId,
      loading,
      error,
      setSelectedFiscalYearId,
      refresh,
    ]
  );

  return (
    <FiscalYearContext.Provider value={value}>{children}</FiscalYearContext.Provider>
  );
}

export function useFiscalYear() {
  const ctx = useContext(FiscalYearContext);
  if (!ctx) {
    return {
      fiscalYears: [] as FiscalYear[],
      selectedFiscalYear: null as FiscalYear | null,
      selectedFiscalYearId: '',
      loading: false,
      error: '',
      setSelectedFiscalYearId: (_id: string) => {},
      refresh: async () => {},
    };
  }
  return ctx;
}
