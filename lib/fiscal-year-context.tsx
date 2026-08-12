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
  fiscalYearService,
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

export function FiscalYearProvider({ children }: { children: React.ReactNode }) {
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [selectedFiscalYearId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const years = await fiscalYearService.list();
      setFiscalYears(years);
      const stored = getStoredFiscalYearId();
      const chosen = pickDefault(years, stored);
      const id = chosen?.id || '';
      setSelectedId(id);
      setStoredFiscalYearId(id || null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load fiscal years');
      setFiscalYears([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === FISCAL_YEAR_STORAGE_KEY && e.newValue) {
        setSelectedId(e.newValue);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
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
