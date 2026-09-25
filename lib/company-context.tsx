'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { API_BASE_URL } from '../app/lib/constants';

export const ALL_COMPANIES_VALUE = '__all__';
export const COMPANY_STORAGE_KEY = 'bisonstechs_active_company_id';
export const COMPANIES_CACHE_KEY = 'bisonstechs_companies_cache';

export type CompanySummary = {
  id: string;
  name: string;
  email?: string | null;
  logo?: string | null;
  businessType?: string | null;
  isActive?: boolean;
  membershipRole?: string;
  isOwner?: boolean;
  isPrimary?: boolean;
  subscriptionPlan?: string;
  subscriptionStatus?: string;
};

type CompaniesCachePayload = {
  companies: CompanySummary[];
  activeCompanyId?: string;
  updatedAt?: number;
};

type CompanyContextValue = {
  companies: CompanySummary[];
  activeCompanyId: string;
  activeCompany: CompanySummary | null;
  isAllCompanies: boolean;
  loading: boolean;
  error: string;
  setActiveCompanyId: (id: string) => void;
  refresh: () => Promise<void>;
  createCompany: (payload: Record<string, unknown>) => Promise<CompanySummary>;
};

const CompanyContext = createContext<CompanyContextValue | null>(null);

function authHeaders(): HeadersInit {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('auth_token') || ''
      : '';
  const companyId =
    typeof window !== 'undefined'
      ? localStorage.getItem(COMPANY_STORAGE_KEY) || ''
      : '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (companyId) headers['X-Company-Id'] = companyId;
  return headers;
}

export function getStoredCompanyId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(COMPANY_STORAGE_KEY);
}

export function setStoredCompanyId(id: string | null) {
  if (typeof window === 'undefined') return;
  if (!id) localStorage.removeItem(COMPANY_STORAGE_KEY);
  else localStorage.setItem(COMPANY_STORAGE_KEY, id);
  try {
    document.cookie = `active_company_id=${encodeURIComponent(id || '')}; path=/; SameSite=Lax; max-age=31536000`;
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event('active-company-changed'));
}

function readCompaniesCache(): CompaniesCachePayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(COMPANIES_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CompaniesCachePayload;
    if (!Array.isArray(parsed?.companies)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCompaniesCache(companies: CompanySummary[], activeCompanyId: string) {
  if (typeof window === 'undefined') return;
  try {
    const payload: CompaniesCachePayload = {
      companies,
      activeCompanyId,
      updatedAt: Date.now(),
    };
    localStorage.setItem(COMPANIES_CACHE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota */
  }
}

function clearCompaniesCache() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(COMPANIES_CACHE_KEY);
  } catch {
    /* ignore */
  }
}

function initialFromCache(): {
  companies: CompanySummary[];
  activeCompanyId: string;
  hasCache: boolean;
} {
  if (typeof window === 'undefined') {
    return { companies: [], activeCompanyId: '', hasCache: false };
  }
  const token = localStorage.getItem('auth_token');
  if (!token) {
    return { companies: [], activeCompanyId: '', hasCache: false };
  }
  const cached = readCompaniesCache();
  const storedId = getStoredCompanyId() || cached?.activeCompanyId || '';
  if (cached?.companies?.length) {
    return {
      companies: cached.companies,
      activeCompanyId: storedId,
      hasCache: true,
    };
  }
  if (storedId) {
    return { companies: [], activeCompanyId: storedId, hasCache: false };
  }
  return { companies: [], activeCompanyId: '', hasCache: false };
}

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [activeCompanyId, setActiveId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hydrated, setHydrated] = useState(false);

  // Instant local restore before paint — avoids "Loading…" flash in header
  React.useLayoutEffect(() => {
    const boot = initialFromCache();
    if (boot.hasCache || boot.activeCompanyId) {
      setCompanies(boot.companies);
      setActiveId(boot.activeCompanyId);
      if (boot.hasCache) setLoading(false);
    }
    setHydrated(true);
  }, []);

  const applySelection = useCallback((list: CompanySummary[], preferred: string | null) => {
    if (preferred === ALL_COMPANIES_VALUE) {
      setActiveId(ALL_COMPANIES_VALUE);
      setStoredCompanyId(ALL_COMPANIES_VALUE);
      writeCompaniesCache(list, ALL_COMPANIES_VALUE);
      return;
    }
    if (preferred && list.some((c) => c.id === preferred)) {
      setActiveId(preferred);
      setStoredCompanyId(preferred);
      writeCompaniesCache(list, preferred);
      return;
    }
    const primary = list.find((c) => c.isPrimary) || list[0];
    const id = primary?.id || '';
    setActiveId(id);
    setStoredCompanyId(id || null);
    writeCompaniesCache(list, id);
  }, []);

  const refresh = useCallback(async () => {
    setError('');
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setCompanies([]);
        setActiveId('');
        clearCompaniesCache();
        setLoading(false);
        return;
      }
      const res = await fetch(`${API_BASE_URL}/api/companies/mine`, {
        headers: authHeaders(),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to load companies');
      const list = (json.data?.companies || []) as CompanySummary[];
      setCompanies(list);
      const stored = getStoredCompanyId();
      applySelection(list, stored || json.data?.activeCompanyId || null);
    } catch (e: unknown) {
      // Keep cached companies visible if network refresh fails
      setError(e instanceof Error ? e.message : 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  }, [applySelection]);

  useEffect(() => {
    if (!hydrated) return;
    void refresh();
  }, [hydrated, refresh]);

  const setActiveCompanyId = useCallback(
    (id: string) => {
      setActiveId(id);
      setStoredCompanyId(id);
      writeCompaniesCache(companies, id);
      // Clear warehouse selection when company changes — warehouses are company-scoped
      try {
        localStorage.removeItem('selected_location_id');
        localStorage.removeItem('cached_locations');
        window.dispatchEvent(new Event('locations-cache-changed'));
        window.dispatchEvent(new Event('active-company-changed'));
      } catch {
        /* ignore */
      }
    },
    [companies]
  );

  const createCompany = useCallback(
    async (payload: Record<string, unknown>) => {
      const res = await fetch(`${API_BASE_URL}/api/companies`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to create company');
      const created = json.data as CompanySummary;
      await refresh();
      setActiveCompanyId(created.id);
      return created;
    },
    [refresh, setActiveCompanyId]
  );

  const activeCompany = useMemo(() => {
    if (activeCompanyId === ALL_COMPANIES_VALUE) return null;
    return companies.find((c) => c.id === activeCompanyId) || null;
  }, [companies, activeCompanyId]);

  const value = useMemo(
    () => ({
      companies,
      activeCompanyId,
      activeCompany,
      isAllCompanies: activeCompanyId === ALL_COMPANIES_VALUE,
      loading,
      error,
      setActiveCompanyId,
      refresh,
      createCompany,
    }),
    [
      companies,
      activeCompanyId,
      activeCompany,
      loading,
      error,
      setActiveCompanyId,
      refresh,
      createCompany,
    ]
  );

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) {
    throw new Error('useCompany must be used within CompanyProvider');
  }
  return ctx;
}

export function useCompanyOptional() {
  return useContext(CompanyContext);
}
