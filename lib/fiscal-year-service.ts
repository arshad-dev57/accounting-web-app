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

function unwrapList(data: any): FiscalYear[] {
  const raw = data?.data ?? data ?? [];
  return Array.isArray(raw) ? raw : [];
}

export const fiscalYearService = {
  list: async (): Promise<FiscalYear[]> => {
    const res = await apiClient.get('/api/fiscal-year');
    if (!res.success) throw new Error(res.message || 'Failed to load fiscal years');
    return unwrapList(res.data);
  },

  active: async (): Promise<FiscalYear | null> => {
    const res = await apiClient.get('/api/fiscal-year/active');
    if (!res.success) return null;
    return (res.data?.data ?? res.data) || null;
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
    return res.data?.data ?? res.data;
  },

  update: async (
    id: string,
    body: Partial<{ name: string; startDate: string; endDate: string; periodType: string }>
  ): Promise<FiscalYear> => {
    const res = await apiClient.put(`/api/fiscal-year/${id}`, body);
    if (!res.success) throw new Error(res.message || 'Failed to update fiscal year');
    return res.data?.data ?? res.data;
  },

  close: async (id: string): Promise<FiscalYear> => {
    const res = await apiClient.post(`/api/fiscal-year/${id}/close`);
    if (!res.success) throw new Error(res.message || 'Failed to close fiscal year');
    return res.data?.data ?? res.data;
  },

  reopen: async (id: string): Promise<FiscalYear> => {
    const res = await apiClient.post(`/api/fiscal-year/${id}/reopen`);
    if (!res.success) throw new Error(res.message || 'Failed to reopen fiscal year');
    return res.data?.data ?? res.data;
  },
};
