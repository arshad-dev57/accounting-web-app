import { apiClient } from '@/lib/api-client';

// Re-export GET from the correctly-named route so this legacy path also works
export { GET } from '../trial-balance/route';


// ─── TYPES ─────────────────────────────────────────────────────

export interface TrialBalanceAccount {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  debitBalance: number;
  creditBalance: number;
}

export interface TrialBalanceStats {
  totalDebit: number;
  totalCredit: number;
  difference: number;
  isBalanced: boolean;
  totalAccounts: number;
}

export interface TrialBalanceListResponse {
  success: boolean;
  data: TrialBalanceAccount[];
  stats: TrialBalanceStats;
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

export const trialBalanceService = {
  // ─── Get trial balance with pagination and filters ──────────
  getTrialBalance: async (params: {
    page?: number;
    limit?: number;
    accountType?: string;
    showZeroBalance?: boolean;
    startDate?: string;
    endDate?: string;
    fiscalYearId?: string;
    locationId?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<TrialBalanceListResponse> => {
    const query = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });

    const url = `/api/trial-balance${query.toString() ? `?${query.toString()}` : ''}`;
    
    try {
      const response = await apiClient.get(url);

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch trial balance');
      }

      // apiClient.get returns: { statusCode, data: rawJson, success, message }
      // where rawJson from backend is: { success: true, count, data: [...accounts], summary: { totalDebit, totalCredit, difference, isBalanced }, period: {...} }
      const rawPayload = response.data || {};
      
      const accounts: TrialBalanceAccount[] = Array.isArray(rawPayload.data)
        ? rawPayload.data
        : Array.isArray(rawPayload)
        ? rawPayload
        : Array.isArray(response.data)
        ? response.data
        : [];

      const rawSummary = rawPayload.summary || (response as any).summary || {};

      // Fallback calculation directly from accounts list if summary numbers are missing/zero
      const calculatedDebit = accounts.reduce((sum, acc) => sum + (Number(acc.debitBalance) || 0), 0);
      const calculatedCredit = accounts.reduce((sum, acc) => sum + (Number(acc.creditBalance) || 0), 0);
      const calculatedDiff = Math.abs(calculatedDebit - calculatedCredit);

      const totalDebit = rawSummary.totalDebit !== undefined && rawSummary.totalDebit !== null
        ? Number(rawSummary.totalDebit)
        : calculatedDebit;
      const totalCredit = rawSummary.totalCredit !== undefined && rawSummary.totalCredit !== null
        ? Number(rawSummary.totalCredit)
        : calculatedCredit;
      const difference = rawSummary.difference !== undefined && rawSummary.difference !== null
        ? Number(rawSummary.difference)
        : calculatedDiff;
      const isBalanced = rawSummary.isBalanced !== undefined
        ? Boolean(rawSummary.isBalanced)
        : (difference < 0.01);

      const totalAccounts = typeof rawPayload.count === 'number' ? rawPayload.count : accounts.length;

      return {
        success: response.success,
        data: accounts,
        stats: {
          totalDebit,
          totalCredit,
          difference,
          isBalanced,
          totalAccounts,
        },
        pagination: {
          page: params.page || 1,
          limit: params.limit || totalAccounts || 10,
          total: totalAccounts,
          pages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };
    } catch (error: any) {
      console.error('Get trial balance error:', error);
      throw new Error(error.message || 'Failed to fetch trial balance');
    }
  },

  // ─── Get trial balance stats ──────────────────────────────────
  getStats: async (params?: {
    startDate?: string;
    endDate?: string;
    fiscalYearId?: string;
  }): Promise<TrialBalanceStats> => {
    const query = new URLSearchParams();
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.fiscalYearId) query.append('fiscalYearId', params.fiscalYearId);
    
    const url = `/api/trial-balance/stats${query.toString() ? `?${query.toString()}` : ''}`;
    
    try {
      const response = await apiClient.get(url);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch trial balance stats');
      }
      return response.data?.data || {
        totalDebit: 0,
        totalCredit: 0,
        difference: 0,
        isBalanced: true,
        totalAccounts: 0
      };
    } catch (error: any) {
      console.error('Get trial balance stats error:', error);
      throw new Error(error.message || 'Failed to fetch trial balance stats');
    }
  },

  // ─── Export trial balance ─────────────────────────────────────
  exportTrialBalance: async (params?: {
    format?: string;
    accountType?: string;
    startDate?: string;
    endDate?: string;
    fiscalYearId?: string;
  }): Promise<string> => {
    const query = new URLSearchParams();
    if (params?.format) query.append('format', params.format);
    if (params?.accountType) query.append('accountType', params.accountType);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.fiscalYearId) query.append('fiscalYearId', params.fiscalYearId);
    
    const url = `/api/trial-balance/export${query.toString() ? `?${query.toString()}` : ''}`;
    
    try {
      const response = await apiClient.get(url);
      if (!response.success) {
        throw new Error(response.message || 'Failed to export trial balance');
      }
      return response.data?.data || response.data?.url || '';
    } catch (error: any) {
      console.error('Export trial balance error:', error);
      throw new Error(error.message || 'Failed to export trial balance');
    }
  }
};