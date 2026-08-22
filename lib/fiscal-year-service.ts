import { apiClient } from '@/lib/api-client';

export type FiscalYearStatus = 'Open' | 'Closed';

export interface FiscalYear {
  id: string;
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

export function getStoredFiscalYearId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(FISCAL_YEAR_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredFiscalYearId(id: string | null) {
  if (typeof window === 'undefined') return;
  try {
    if (id) localStorage.setItem(FISCAL_YEAR_STORAGE_KEY, id);
    else localStorage.removeItem(FISCAL_YEAR_STORAGE_KEY);
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

export function getCachedFiscalYears(): FiscalYear[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FISCAL_YEARS_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(parseFiscalYear).filter((y): y is FiscalYear => !!y);
  } catch {
    return [];
  }
}

export function setCachedFiscalYears(list: FiscalYear[]) {
  if (typeof window === 'undefined') return;
  try {
    const clean = list.map(parseFiscalYear).filter((y): y is FiscalYear => !!y);
    localStorage.setItem(FISCAL_YEARS_CACHE_KEY, JSON.stringify(clean));
    window.dispatchEvent(new CustomEvent(FISCAL_YEARS_CACHE_EVENT));
  } catch {
    /* ignore */
  }
}

export function upsertCachedFiscalYear(year: FiscalYear | null | undefined): FiscalYear[] {
  const next = parseFiscalYear(year);
  if (!next) return getCachedFiscalYears();
  const list = getCachedFiscalYears();
  const idx = list.findIndex((y) => y.id === next.id);
  if (idx >= 0) list[idx] = { ...list[idx], ...next };
  else list.push(next);
  setCachedFiscalYears(list);
  return list;
}

function unwrapList(data: any): FiscalYear[] {
  const raw = data?.data ?? data ?? [];
  const list = Array.isArray(raw) ? raw : [];
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
