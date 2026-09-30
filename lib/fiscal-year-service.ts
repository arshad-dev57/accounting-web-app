import { apiClient } from '@/lib/api-client';

/** Keep in sync with company-context COMPANY_STORAGE_KEY (avoid circular import). */
const COMPANY_STORAGE_KEY = 'bisonstechs_active_company_id';

export type FiscalYearStatus = 'Open' | 'Closed';

export interface FiscalYear {
  id: string;
  companyId?: string | null;
  name: string;
  startDate: string;
  endDate: string;
  status: FiscalYearStatus | string;
  periodType?: string | null;
  closedAt?: string | null;
  closedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export const FISCAL_YEAR_STORAGE_KEY = 'selected_fiscal_year_id';
export const FISCAL_YEARS_CACHE_KEY = 'cached_fiscal_years';
export const FISCAL_YEARS_CACHE_EVENT = 'fiscal-years-cache-changed';

/** Backend GET paths that accept fiscalYearId filtering */
export const FISCAL_YEAR_QUERY_PATHS = [
  '/api/balance-sheet',
  '/api/reports/profit-loss',
  '/api/reports/cash-flow',
  '/api/trial-balance',
  '/api/general-ledger',
  '/api/accounts-payable',
  '/api/accounts-receivable',
  '/api/aged-receivables',
  '/api/expenses',
  '/api/income',
  '/api/journal-entries',
  '/api/payments-made',
  '/api/payments-received',
  '/api/credit-notes',
  '/api/fixed-assets',
  '/api/loans',
  '/api/warehouse/invoices',
  '/api/warehouse/purchase-invoices',
  '/api/dashboard',
  '/api/sales/dashboard',
  '/api/purchases/dashboard',
  '/api/warehouse/sales/dashboard',
  '/api/warehouse/sales/reports',
  '/api/purchase/dashboard',
  '/api/purchase/reports',
  '/api/purchase/invoices',
  '/api/sales/invoices',
  '/api/bills',
];

export function shouldAttachFiscalYear(url?: string): boolean {
  if (!url) return false;
  const path = url.split('?')[0];
  return FISCAL_YEAR_QUERY_PATHS.some((p) => path.includes(p));
}

function resolveCompanyId(companyId?: string | null): string | null {
  const explicit = String(companyId || '').trim();
  if (explicit) return explicit;
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(COMPANY_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Per-company selection key: selected_fiscal_year_id:<companyId> */
export function fiscalYearSelectionKey(companyId?: string | null): string {
  const cid = resolveCompanyId(companyId);
  return cid ? `${FISCAL_YEAR_STORAGE_KEY}:${cid}` : FISCAL_YEAR_STORAGE_KEY;
}

/** Per-company cache key: cached_fiscal_years:<companyId> */
export function fiscalYearsCacheKey(companyId?: string | null): string {
  const cid = resolveCompanyId(companyId);
  return cid ? `${FISCAL_YEARS_CACHE_KEY}:${cid}` : FISCAL_YEARS_CACHE_KEY;
}

export function getStoredFiscalYearId(companyId?: string | null): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const scoped = localStorage.getItem(fiscalYearSelectionKey(companyId));
    if (scoped) return scoped;
    // Legacy global key — only when no company context yet
    if (!resolveCompanyId(companyId)) {
      return localStorage.getItem(FISCAL_YEAR_STORAGE_KEY);
    }
    return null;
  } catch {
    return null;
  }
}

export function setStoredFiscalYearId(id: string | null, companyId?: string | null) {
  if (typeof window === 'undefined') return;
  try {
    const key = fiscalYearSelectionKey(companyId);
    if (id) localStorage.setItem(key, id);
    else localStorage.removeItem(key);
    // Drop legacy global key so it cannot leak across companies
    localStorage.removeItem(FISCAL_YEAR_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function parseFiscalYear(raw: any): FiscalYear | null {
  if (!raw || typeof raw !== 'object') return null;
  const id = String(raw.id || raw._id || '').trim();
  if (!id) return null;
  return {
    id,
    companyId: raw.companyId ? String(raw.companyId) : null,
    name: String(raw.name || 'Fiscal year'),
    startDate: String(raw.startDate || ''),
    endDate: String(raw.endDate || ''),
    status: raw.status || 'Open',
    periodType: raw.periodType ?? null,
    closedAt: raw.closedAt ?? null,
    closedBy: raw.closedBy ?? null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export function getCachedFiscalYears(companyId?: string | null): FiscalYear[] {
  if (typeof window === 'undefined') return [];
  try {
    const cid = resolveCompanyId(companyId);
    const raw = localStorage.getItem(fiscalYearsCacheKey(cid));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const list = parsed.map(parseFiscalYear).filter((y): y is FiscalYear => !!y);
    // Reject cache that belongs to another company
    if (cid) {
      const mismatched = list.some((y) => y.companyId && y.companyId !== cid);
      if (mismatched) return [];
    }
    return list;
  } catch {
    return [];
  }
}

export function setCachedFiscalYears(list: FiscalYear[], companyId?: string | null) {
  if (typeof window === 'undefined') return;
  try {
    const cid = resolveCompanyId(companyId);
    const clean = list
      .map(parseFiscalYear)
      .filter((y): y is FiscalYear => !!y)
      .map((y) => (cid && !y.companyId ? { ...y, companyId: cid } : y));
    localStorage.setItem(fiscalYearsCacheKey(cid), JSON.stringify(clean));
    // Drop legacy global cache
    localStorage.removeItem(FISCAL_YEARS_CACHE_KEY);
    window.dispatchEvent(
      new CustomEvent(FISCAL_YEARS_CACHE_EVENT, { detail: { companyId: cid } })
    );
  } catch {
    /* ignore */
  }
}

export function clearFiscalYearLocalState(companyId?: string | null) {
  if (typeof window === 'undefined') return;
  try {
    const cid = resolveCompanyId(companyId);
    if (cid) {
      localStorage.removeItem(fiscalYearSelectionKey(cid));
      localStorage.removeItem(fiscalYearsCacheKey(cid));
    }
    localStorage.removeItem(FISCAL_YEAR_STORAGE_KEY);
    localStorage.removeItem(FISCAL_YEARS_CACHE_KEY);
    window.dispatchEvent(
      new CustomEvent(FISCAL_YEARS_CACHE_EVENT, { detail: { companyId: cid } })
    );
  } catch {
    /* ignore */
  }
}

export function upsertCachedFiscalYear(year: FiscalYear | null | undefined): FiscalYear[] {
  const next = parseFiscalYear(year);
  if (!next) return getCachedFiscalYears();
  const cid = next.companyId || resolveCompanyId();
  const list = getCachedFiscalYears(cid);
  const idx = list.findIndex((y) => y.id === next.id);
  if (idx >= 0) list[idx] = { ...list[idx], ...next };
  else list.push(next);
  setCachedFiscalYears(list, cid);
  return list;
}

function unwrapList(data: any): FiscalYear[] {
  const raw = data?.data ?? data ?? [];
  const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
  return list.map(parseFiscalYear).filter((y): y is FiscalYear => !!y);
}

export const fiscalYearService = {
  list: async (): Promise<FiscalYear[]> => {
    const res = await apiClient.get('/api/fiscal-year');
    if (!res.success) throw new Error(res.message || 'Failed to load fiscal years');
    const list = unwrapList(res.data);
    setCachedFiscalYears(list);
    return list;
  },

  listCached: async (): Promise<FiscalYear[]> => {
    const cached = getCachedFiscalYears();
    if (cached.length) return cached;
    return fiscalYearService.list();
  },

  active: async (): Promise<FiscalYear | null> => {
    const res = await apiClient.get('/api/fiscal-year/active');
    if (!res.success) return null;
    return parseFiscalYear(res.data?.data ?? res.data);
  },

  create: async (body: {
    name: string;
    startDate: string;
    endDate: string;
    periodType?: string;
    status?: string;
  }): Promise<FiscalYear> => {
    const res = await apiClient.post('/api/fiscal-year', body);
    if (!res.success) throw new Error(res.message || 'Failed to create fiscal year');
    const created = parseFiscalYear(res.data?.data ?? res.data);
    if (created) upsertCachedFiscalYear(created);
    return created || (res.data?.data ?? res.data);
  },

  update: async (
    id: string,
    body: Partial<{ name: string; startDate: string; endDate: string; periodType: string }>
  ): Promise<FiscalYear> => {
    const res = await apiClient.put(`/api/fiscal-year/${id}`, body);
    if (!res.success) throw new Error(res.message || 'Failed to update fiscal year');
    const updated = parseFiscalYear(res.data?.data ?? res.data);
    if (updated) upsertCachedFiscalYear(updated);
    return updated || (res.data?.data ?? res.data);
  },

  close: async (id: string): Promise<FiscalYear> => {
    const res = await apiClient.post(`/api/fiscal-year/${id}/close`);
    if (!res.success) throw new Error(res.message || 'Failed to close fiscal year');
    const updated = parseFiscalYear(res.data?.data ?? res.data);
    if (updated) upsertCachedFiscalYear(updated);
    return updated || (res.data?.data ?? res.data);
  },

  reopen: async (id: string): Promise<FiscalYear> => {
    const res = await apiClient.post(`/api/fiscal-year/${id}/reopen`);
    if (!res.success) throw new Error(res.message || 'Failed to reopen fiscal year');
    const updated = parseFiscalYear(res.data?.data ?? res.data);
    if (updated) upsertCachedFiscalYear(updated);
    return updated || (res.data?.data ?? res.data);
  },
};
