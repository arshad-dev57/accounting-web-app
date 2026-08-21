import { apiClient } from '@/lib/api-client';

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
      
      const data = response.data || {};
      
      return {
        success: response.success,
        data: data.data || [],
        stats: data.stats || {
          totalDebit: 0,
          totalCredit: 0,
          difference: 0,
          isBalanced: true,
          totalAccounts: 0
        },
        pagination: data.pagination || {
          page: params.page || 1,
          limit: params.limit || 10,
          total: 0,
          pages: 0,
          hasNext: false,
          hasPrev: false
        }
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