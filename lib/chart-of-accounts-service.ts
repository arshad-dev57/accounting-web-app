import { apiClient } from '@/lib/api-client';

// ─── TYPES ─────────────────────────────────────────────────────

export interface ChartOfAccount {
  id: string;
  code: string;
  name: string;
  type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  parentAccount?: string;
  description?: string;
  taxCode?: string;
  balance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChartOfAccountStats {
  total: number;
  assetTotal: number;
  liabilityTotal: number;
  equityTotal: number;
  revenueTotal: number;
  expenseTotal: number;
}

export interface ChartOfAccountListResponse {
  success: boolean;
  data: ChartOfAccount[];
  stats: ChartOfAccountStats;
  typeStats?: any;
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

export const chartOfAccountService = {
  // ─── Get accounts with pagination and filters ──────────────
  getAccounts: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<ChartOfAccountListResponse> => {
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

    const url = `/api/chart-of-accounts${query.toString() ? `?${query.toString()}` : ''}`;
    
    try {
      const response = await apiClient.get(url);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch accounts');
      }
      
      const data = response.data || {};
      const rawAccounts = Array.isArray(data.data)
        ? data.data
        : Array.isArray(data)
          ? data
          : [];
      
      // Map currentBalance to balance for frontend compatibility
      const accounts = rawAccounts.map((account: any) => ({
        ...account,
        balance: account.currentBalance ?? account.balance ?? 0
      }));
      
      // Map backend summary to frontend stats format
      const summary = data.summary || {};
      const total = Number(
        data.pagination?.total ?? data.totalCount ?? data.stats?.total ?? accounts.length
      );
      const pages = Number(
        data.pagination?.pages ?? (Math.max(1, Math.ceil(total / limit) || 1))
      );
      const currentPage = Number(data.pagination?.page ?? page);
      const stats = {
        total,
        assetTotal: data.stats?.assetTotal ?? summary.Assets ?? 0,
        liabilityTotal: data.stats?.liabilityTotal ?? summary.Liabilities ?? 0,
        equityTotal: data.stats?.equityTotal ?? summary.Equity ?? 0,
        revenueTotal: data.stats?.revenueTotal ?? summary.Income ?? 0,
        expenseTotal: data.stats?.expenseTotal ?? summary.Expenses ?? 0
      };
      
      return {
        success: response.success,
        data: accounts,
        stats,
        typeStats: data.typeStats,
        pagination: {
          page: currentPage,
          limit: Number(data.pagination?.limit ?? limit),
          total,
          pages,
          hasNext: data.pagination?.hasNext ?? currentPage < pages,
          hasPrev: data.pagination?.hasPrev ?? currentPage > 1
        }
      };
    } catch (error: any) {
      console.error('Get accounts error:', error);
      throw new Error(error.message || 'Failed to fetch accounts');
    }
  },

  // ─── Create account ──────────────────────────────────────────
  createAccount: async (data: Partial<ChartOfAccount>): Promise<ChartOfAccount> => {
    try {
      const response = await apiClient.post('/api/chart-of-accounts', data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to create account');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Create account error:', error);
      throw new Error(error.message || 'Failed to create account');
    }
  },

  // ─── Update account ──────────────────────────────────────────
  updateAccount: async (id: string, data: Partial<ChartOfAccount>): Promise<ChartOfAccount> => {
    try {
      const response = await apiClient.put(`/api/chart-of-accounts/${id}`, data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update account');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Update account error:', error);
      throw new Error(error.message || 'Failed to update account');
    }
  },

  // ─── Archive account ─────────────────────────────────────────
  archiveAccount: async (id: string, isActive: boolean): Promise<ChartOfAccount> => {
    try {
      const response = await apiClient.patch(`/api/chart-of-accounts/${id}/archive`, { isActive });
      if (!response.success) {
        throw new Error(response.message || 'Failed to archive account');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Archive account error:', error);
      throw new Error(error.message || 'Failed to archive account');
    }
  },

  // ─── Delete account ──────────────────────────────────────────
  deleteAccount: async (id: string): Promise<void> => {
    try {
      const response = await apiClient.delete(`/api/chart-of-accounts/${id}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete account');
      }
    } catch (error: any) {
      console.error('Delete account error:', error);
      throw new Error(error.message || 'Failed to delete account');
    }
  },

  // ─── Fix cash accounts ──────────────────────────────────────
  fixCashAccounts: async (): Promise<{ count: number }> => {
    try {
      const response = await apiClient.post('/api/chart-of-accounts/fix-cash-accounts');
      if (!response.success) {
        throw new Error(response.message || 'Failed to fix cash accounts');
      }
      return response.data || { count: 0 };
    } catch (error: any) {
      console.error('Fix cash accounts error:', error);
      throw new Error(error.message || 'Failed to fix cash accounts');
    }
  },

  // ─── Get account type stats ──────────────────────────────────
  getAccountTypeStats: async (): Promise<any> => {
    try {
      const response = await apiClient.get('/api/chart-of-accounts/type-stats');
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch account type stats');
      }
      return response.data?.data || {};
    } catch (error: any) {
      console.error('Get account type stats error:', error);
      throw new Error(error.message || 'Failed to fetch account type stats');
    }
  },

  // ─── Check opening balance ──────────────────────────────────
  checkOpeningBalance: async (): Promise<{ hasOpeningBalance: boolean }> => {
    try {
      const response = await apiClient.get('/api/chart-of-accounts/check-opening-balance');
      if (!response.success) {
        throw new Error(response.message || 'Failed to check opening balance');
      }
      return response.data || { hasOpeningBalance: false };
    } catch (error: any) {
      console.error('Check opening balance error:', error);
      throw new Error(error.message || 'Failed to check opening balance');
    }
  }
};