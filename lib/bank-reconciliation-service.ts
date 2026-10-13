import { apiClient } from '@/lib/api-client';

const BASE = '/api/bank-reconciliation';

export type ReconciliationStatus = 'Draft' | 'InProgress' | 'Reconciled' | 'Completed';

export interface BankReconciliationRow {
  id: string;
  companyId: string;
  bankAccountId: string;
  statementStartDate: string;
  statementEndDate: string;
  statementOpeningBalance: number;
  statementClosingBalance: number;
  bookOpeningBalance: number;
  bookClosingBalance: number;
  difference: number;
  reconciledAmount: number;
  unreconciledAmount: number;
  outstandingDeposits: number;
  outstandingPayments: number;
  bankChargesTotal: number;
  bankInterestTotal: number;
  otherAdjustments: number;
  matchedCount: number;
  unmatchedBankCount: number;
  unmatchedBookCount: number;
  status: ReconciliationStatus;
  statementImported?: boolean;
  statementTransactionCount?: number;
  exceptionAllowed?: boolean;
  exceptionNote?: string | null;
  completedAt?: string | null;
  createdAt: string;
  bankAccount?: {
    id: string;
    accountName: string;
    accountNumber: string;
    bankName?: string;
    currentBalance?: number;
  };
  completer?: { firstName?: string; lastName?: string; email?: string } | null;
  creator?: { firstName?: string; lastName?: string; email?: string } | null;
  summary?: Record<string, number>;
  adjustedBankBalance?: number;
}

export interface StatementTxn {
  id: string;
  transactionDate: string;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  amount: number;
  status: string;
  direction?: string;
  isDuplicate?: boolean;
  fingerprint?: string;
  match?: {
    id: string;
    journalLineId: string;
    matchType: string;
    journalLine?: {
      journal?: {
        entryNumber: string;
        description: string;
        reference: string;
        date: string;
      };
    };
  } | null;
}

export interface BookTxn {
  id: string;
  journalEntryId: string;
  entryNumber: string;
  date: string;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  amount: number;
  isReconciled: boolean;
  direction: string;
}

function qs(params?: Record<string, string | number | boolean | undefined | null>) {
  const q = new URLSearchParams();
  if (!params) return '';
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

function unwrap<T>(response: {
  success: boolean;
  data: unknown;
  message?: string;
}): { data: T; message?: string; meta?: unknown } {
  const body = response.data as {
    success?: boolean;
    data?: T;
    message?: string;
    meta?: unknown;
  } | null;

  if (!response.success || body?.success === false) {
    throw new Error(body?.message || response.message || 'Request failed');
  }

  return {
    data: (body?.data !== undefined ? body.data : body) as T,
    message: body?.message || response.message,
    meta: body?.meta,
  };
}

export const bankReconciliationService = {
  async dashboard() {
    const res = await apiClient.get(`${BASE}/dashboard`);
    return unwrap(res);
  },

  async list(params?: Record<string, string | number | undefined>) {
    const res = await apiClient.get(`${BASE}${qs(params)}`);
    return unwrap<BankReconciliationRow[]>(res);
  },

  async get(id: string) {
    const res = await apiClient.get(`${BASE}/${id}`);
    return unwrap<BankReconciliationRow>(res);
  },

  async create(body: {
    bankAccountId: string;
    statementStartDate: string;
    statementEndDate: string;
    statementOpeningBalance: number;
    statementClosingBalance: number;
    importId?: string;
  }) {
    const res = await apiClient.post(BASE, body);
    return unwrap<BankReconciliationRow>(res);
  },

  async previewImport(form: FormData) {
    const headers: Record<string, string> = {};
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token') || '';
      if (token) headers.Authorization = `Bearer ${token}`;
      const companyId = localStorage.getItem('bisonstechs_active_company_id') || '';
      if (companyId) headers['X-Company-Id'] = companyId;
    }
    const httpRes = await fetch('/api/bank-reconciliation/import/preview', {
      method: 'POST',
      headers,
      body: form,
    });
    const json = await httpRes.json();
    if (!json.success) throw new Error(json.message || 'Preview failed');
    return json.data;
  },

  async confirmImport(body: {
    importId: string;
    rows: StatementTxn[];
    columnMapping?: Record<string, string>;
    openingBalance?: number;
    closingBalance?: number;
    skipDuplicates?: boolean;
    rememberMapping?: boolean;
    reconciliationId?: string;
  }) {
    const res = await apiClient.post(`${BASE}/import/confirm`, body);
    return unwrap(res);
  },

  async statementTransactions(params: Record<string, string | number | undefined>) {
    const res = await apiClient.get(`${BASE}/statement-transactions${qs(params)}`);
    return unwrap<{ items: StatementTxn[]; total: number; page: number; pages: number }>(res);
  },

  async bookTransactions(params: Record<string, string | number | undefined>) {
    const res = await apiClient.get(`${BASE}/book-transactions${qs(params)}`);
    return unwrap<{ items: BookTxn[]; total: number; page: number; pages: number }>(res);
  },

  async autoMatch(id: string) {
    const res = await apiClient.post(`${BASE}/${id}/auto-match`, {});
    return unwrap(res);
  },

  async match(id: string, statementTransactionId: string, journalLineId: string) {
    const res = await apiClient.post(`${BASE}/${id}/match`, {
      statementTransactionId,
      journalLineId,
    });
    return unwrap(res);
  },

  async unmatch(id: string, payload: { matchId?: string; statementTransactionId?: string }) {
    const res = await apiClient.post(`${BASE}/${id}/unmatch`, payload);
    return unwrap(res);
  },

  async ignore(id: string, statementTransactionId: string, notes?: string) {
    const res = await apiClient.post(`${BASE}/${id}/ignore`, { statementTransactionId, notes });
    return unwrap(res);
  },

  async createAdjustment(
    id: string,
    body: {
      type: string;
      amount: number;
      offsetAccountId: string;
      description?: string;
      reference?: string;
      postingDate?: string;
      statementTransactionId?: string;
      autoMatchAfter?: boolean;
    }
  ) {
    const res = await apiClient.post(`${BASE}/${id}/adjustments`, body);
    return unwrap(res);
  },

  async complete(id: string, body?: { exceptionAllowed?: boolean; exceptionNote?: string }) {
    const res = await apiClient.post(`${BASE}/${id}/complete`, body || {});
    return unwrap(res);
  },

  async reopen(id: string) {
    const res = await apiClient.post(`${BASE}/${id}/reopen`, {});
    return unwrap(res);
  },

  async refresh(id: string) {
    const res = await apiClient.post(`${BASE}/${id}/refresh`, {});
    return unwrap(res);
  },
};
