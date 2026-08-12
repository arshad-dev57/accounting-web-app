import { apiClient } from '@/lib/api-client';

export interface AccountSummary {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  openingBalance: number;
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
  hasOpeningBalanceEntry: boolean;
}

export interface LedgerEntry {
  id: string;
  journalId: string;
  entryNumber?: string;
  date: string;
  accountId: string;
  accountName: string;
  accountCode: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  reference: string;
  isOpeningBalance: boolean;
}

export interface LedgerStats {
  totalDebit: number;
  totalCredit: number;
  difference: number;
  entryCount: number;
  isBalanced: boolean;
}

export interface LedgerListResponse {
  success: boolean;
  data: LedgerEntry[];
  stats: LedgerStats;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const generalLedgerService = {
  getAccountSummaries: async (params?: {
    startDate?: string;
    endDate?: string;
    fiscalYearId?: string;
  }): Promise<AccountSummary[]> => {
    const query = new URLSearchParams();
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.fiscalYearId) query.append('fiscalYearId', params.fiscalYearId);

    const url = `/api/general-ledger/accounts${query.toString() ? `?${query.toString()}` : ''}`;

    try {
      const response = await apiClient.get(url);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch account summaries');
      }
      const payload = response.data?.data ?? response.data ?? {};
      return Array.isArray(payload) ? payload : payload.data || [];
    } catch (error: any) {
      console.error('Get account summaries error:', error);
      throw new Error(error.message || 'Failed to fetch account summaries');
    }
  },

  getEntries: async (params: {
    page?: number;
    limit?: number;
    accountId?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    showDebitOnly?: boolean;
    showCreditOnly?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    fiscalYearId?: string;
  } = {}): Promise<LedgerListResponse> => {
    const query = new URLSearchParams();
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? Math.min(params.limit, 100) : 10;

    query.set('page', String(page));
    query.set('limit', String(limit));

    Object.entries(params).forEach(([key, value]) => {
      if (key === 'page' || key === 'limit') return;
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });

    const url = `/api/general-ledger/all-entries?${query.toString()}`;

    try {
      const response = await apiClient.get(url);

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch ledger entries');
      }

      const payload = response.data?.data ?? response.data ?? {};
      const summary = payload.summary || {};
      const paginationSource = payload.pagination || {};
      const entries = Array.isArray(payload.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : [];

      const total = Number(
        paginationSource.total ?? payload.totalCount ?? entries.length
      );
      const currentPage = Number(paginationSource.page ?? page);
      const pageSize = Number(paginationSource.limit ?? limit);
      const pages = Number(
        paginationSource.pages ?? Math.max(total === 0 ? 0 : 1, Math.ceil(total / pageSize) || 0)
      );

      return {
        success: response.success,
        data: entries,
        stats: {
          totalDebit: summary.totalDebit || 0,
          totalCredit: summary.totalCredit || 0,
          difference: summary.netDifference ?? summary.difference ?? 0,
          entryCount: total,
          isBalanced:
            summary.isBalanced !== undefined ? summary.isBalanced : true,
        },
        pagination: {
          page: currentPage,
          limit: pageSize,
          total,
          pages,
          hasNext: paginationSource.hasNext ?? currentPage < pages,
          hasPrev: paginationSource.hasPrev ?? currentPage > 1,
        },
      };
    } catch (error: any) {
      console.error('Get ledger entries error:', error);
      throw new Error(error.message || 'Failed to fetch ledger entries');
    }
  },
};
