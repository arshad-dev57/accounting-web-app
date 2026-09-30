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
  FISCAL_YEARS_CACHE_KEY,
  fiscalYearSelectionKey,
  fiscalYearsCacheKey,
  fiscalYearService,
  getCachedFiscalYears,
  getStoredFiscalYearId,
  setStoredFiscalYearId,
} from './fiscal-year-service';
import { getStoredCompanyId } from './company-context';

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
  // Same initial state on server and client — cache loads in useEffect only (avoids hydration mismatch).
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [selectedFiscalYearId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
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
      if (cached.length) {
        setFiscalYears(cached);
        applyFiscalSelection(cached, setSelectedId);
      } else {
        setFiscalYears([]);
        setSelectedId('');
        setStoredFiscalYearId(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadForActiveCompany = useCallback(() => {
    const cached = getCachedFiscalYears();
    if (cached.length) {
      setFiscalYears(cached);
      applyFiscalSelection(cached, setSelectedId);
      setLoading(false);
      // Still refresh in background so company switch picks up server truth
      void refresh();
      return;
    }
    setFiscalYears([]);
    setSelectedId('');
    setLoading(true);
    void refresh();
  }, [refresh]);

  useEffect(() => {
    loadForActiveCompany();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Company switch: drop in-memory state and load that company's FY (local + API)
  useEffect(() => {
    const onCompany = () => {
      setError('');
      setFiscalYears([]);
      setSelectedId('');
      setLoading(true);
      // Company id already updated in storage before this event
      loadForActiveCompany();
    };
    window.addEventListener('active-company-changed', onCompany);
    return () => window.removeEventListener('active-company-changed', onCompany);
  }, [loadForActiveCompany]);

  useEffect(() => {
    const onCache = () => {
      const years = getCachedFiscalYears();
      setFiscalYears(years);
      applyFiscalSelection(years, setSelectedId);
    };
    const onStorage = (e: StorageEvent) => {
      const cid = getStoredCompanyId();
      const selKey = fiscalYearSelectionKey(cid);
      const cacheKey = fiscalYearsCacheKey(cid);
      if (
        e.key === selKey ||
        e.key === FISCAL_YEAR_STORAGE_KEY ||
        (e.key?.startsWith(`${FISCAL_YEAR_STORAGE_KEY}:`) && e.key === selKey)
      ) {
        if (e.newValue) setSelectedId(e.newValue);
      }
      if (
        e.key === cacheKey ||
        e.key === FISCAL_YEARS_CACHE_KEY ||
        e.key === `${FISCAL_YEARS_CACHE_KEY}:${cid || ''}`
      ) {
        onCache();
      }
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
