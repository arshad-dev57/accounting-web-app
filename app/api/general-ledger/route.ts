import { apiClient } from '@/lib/api-client';

// ─── TYPES ─────────────────────────────────────────────────────

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

// ─── SERVICE ──────────────────────────────────────────────────

export const generalLedgerService = {
  // ─── Get account summaries ──────────────────────────────────
  getAccountSummaries: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<AccountSummary[]> => {
    const query = new URLSearchParams();
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    
    const url = `/api/general-ledger/accounts${query.toString() ? `?${query.toString()}` : ''}`;
    
    try {
      const response = await apiClient.get(url);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch account summaries');
      }
      return response.data?.data || [];
    } catch (error: any) {
      console.error('Get account summaries error:', error);
      throw new Error(error.message || 'Failed to fetch account summaries');
    }
  },

  // ─── Get ledger entries with pagination and filters ────────
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
  } = {}): Promise<LedgerListResponse> => {
    const query = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });

    const endpoint = params.accountId 
      ? `/api/general-ledger/entries/${params.accountId}`
      : '/api/general-ledger/all-entries';
    
    // Remove accountId from query params as it's in the URL
    query.delete('accountId');
    
    const url = `${endpoint}${query.toString() ? `?${query.toString()}` : ''}`;
    
    try {
      const response = await apiClient.get(url);
      
      console.log('General Ledger API Response:', JSON.stringify(response, null, 2));
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch ledger entries');
      }
      
      // The API response has nested structure: response.data.data.data contains the entries
      const outerData = response.data || {};
      const innerData = outerData.data || {};
      
      // Backend returns 'summary' but frontend expects 'stats'
      const summary = innerData.summary || {};
      const pagination = innerData.pagination || {};
      
      // The actual entries array is at innerData.data
      const entries = Array.isArray(innerData.data) ? innerData.data : [];
      
      return {
        success: response.success,
        data: entries,
        stats: {
          totalDebit: summary.totalDebit || 0,
          totalCredit: summary.totalCredit || 0,
          difference: summary.netDifference || 0,
          entryCount: innerData.count || entries.length,
          isBalanced: summary.isBalanced !== undefined ? summary.isBalanced : true
        },
        pagination: {
          page: pagination.page || params.page || 1,
          limit: pagination.limit || params.limit || 10,
          total: pagination.total || innerData.totalCount || entries.length,
          pages: pagination.pages || 0,
          hasNext: pagination.hasNext || false,
          hasPrev: pagination.hasPrev || false
        }
      };
    } catch (error: any) {
      console.error('Get ledger entries error:', error);
      throw new Error(error.message || 'Failed to fetch ledger entries');
    }
  },

  // ─── Get ledger entry by ID ──────────────────────────────────
  getEntryById: async (id: string): Promise<LedgerEntry> => {
    try {
      const response = await apiClient.get(`/api/general-ledger/entries/${id}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch ledger entry');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Get ledger entry error:', error);
      throw new Error(error.message || 'Failed to fetch ledger entry');
    }
  },

  // ─── Get ledger stats ────────────────────────────────────────
  getStats: async (params?: {
    startDate?: string;
    endDate?: string;
    accountId?: string;
  }): Promise<LedgerStats> => {
    const query = new URLSearchParams();
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.accountId) query.append('accountId', params.accountId);
    
    const url = `/api/general-ledger/stats${query.toString() ? `?${query.toString()}` : ''}`;
    
    try {
      const response = await apiClient.get(url);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch ledger stats');
      }
      return response.data?.data || {
        totalDebit: 0,
        totalCredit: 0,
        difference: 0,
        entryCount: 0,
        isBalanced: true
      };
    } catch (error: any) {
      console.error('Get ledger stats error:', error);
      throw new Error(error.message || 'Failed to fetch ledger stats');
    }
  },

  // ─── Export ledger ────────────────────────────────────────────
  exportLedger: async (params?: {
    format?: string;
    accountId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<string> => {
    const query = new URLSearchParams();
    if (params?.format) query.append('format', params.format);
    if (params?.accountId) query.append('accountId', params.accountId);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    
    const url = `/api/general-ledger/export${query.toString() ? `?${query.toString()}` : ''}`;
    
    try {
      const response = await apiClient.get(url);
      if (!response.success) {
        throw new Error(response.message || 'Failed to export ledger');
      }
      return response.data?.data || response.data?.url || '';
    } catch (error: any) {
      console.error('Export ledger error:', error);
      throw new Error(error.message || 'Failed to export ledger');
    }
  }
};