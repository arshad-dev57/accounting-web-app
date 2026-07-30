import { apiClient } from '@/lib/api-client';

// ─── TYPES ─────────────────────────────────────────────────────

export interface BankAccount {
  id: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  branchCode: string;
  accountType: string;
  currency: string;
  openingBalance: number;
  currentBalance: number;
  status: string;
  lastReconciled: string;
  chartOfAccountId: string;
}

export interface BankAccountStats {
  totalBalance: number;
  pkrBalance: number;
  usdBalance: number;
  activeCount: number;
  totalCount: number;
}

export interface BankAccountListResponse {
  success: boolean;
  data: BankAccount[];
  stats: BankAccountStats;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreateBankAccountRequest {
  accountName: string;
  accountNumber: string;
  bankName: string;
  branchCode?: string;
  accountType: string;
  currency: string;
  openingBalance?: number;
}

// ─── SERVICE ──────────────────────────────────────────────────

export const bankAccountService = {
  // ─── Get bank accounts with pagination and filters ──────────
  getAccounts: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<BankAccountListResponse> => {
    const query = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });

    const url = `/api/bank-accounts${query.toString() ? `?${query.toString()}` : ''}`;
    
    try {
      const response = await apiClient.get(url);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch bank accounts');
      }
      
      const data = response.data || {};
      
      return {
        success: response.success,
        data: data.data || [],
        stats: data.stats || {
          totalBalance: 0,
          pkrBalance: 0,
          usdBalance: 0,
          activeCount: 0,
          totalCount: 0
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
      console.error('Get bank accounts error:', error);
      throw new Error(error.message || 'Failed to fetch bank accounts');
    }
  },

  // ─── Create bank account ──────────────────────────────────────
  createAccount: async (data: CreateBankAccountRequest): Promise<BankAccount> => {
    try {
      const response = await apiClient.post('/api/bank-accounts', data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to create bank account');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Create bank account error:', error);
      throw new Error(error.message || 'Failed to create bank account');
    }
  },

  // ─── Update bank account ──────────────────────────────────────
  updateAccount: async (id: string, data: Partial<CreateBankAccountRequest>): Promise<BankAccount> => {
    try {
      const response = await apiClient.put(`/api/bank-accounts/${id}`, data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update bank account');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Update bank account error:', error);
      throw new Error(error.message || 'Failed to update bank account');
    }
  },

  // ─── Delete bank account ──────────────────────────────────────
  deleteAccount: async (id: string): Promise<void> => {
    try {
      const response = await apiClient.delete(`/api/bank-accounts/${id}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete bank account');
      }
    } catch (error: any) {
      console.error('Delete bank account error:', error);
      throw new Error(error.message || 'Failed to delete bank account');
    }
  },

  // ─── Get bank account stats ──────────────────────────────────
  getStats: async (): Promise<BankAccountStats> => {
    try {
      const response = await apiClient.get('/api/bank-accounts/stats');
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch bank account stats');
      }
      return response.data?.data || {
        totalBalance: 0,
        pkrBalance: 0,
        usdBalance: 0,
        activeCount: 0,
        totalCount: 0
      };
    } catch (error: any) {
      console.error('Get bank account stats error:', error);
      throw new Error(error.message || 'Failed to fetch bank account stats');
    }
  },

  // ─── Export bank accounts ────────────────────────────────────
  exportAccounts: async (params?: {
    format?: string;
    status?: string;
  }): Promise<string> => {
    const query = new URLSearchParams();
    if (params?.format) query.append('format', params.format);
    if (params?.status) query.append('status', params.status);
    
    const url = `/api/bank-accounts/export${query.toString() ? `?${query.toString()}` : ''}`;
    
    try {
      const response = await apiClient.get(url);
      if (!response.success) {
        throw new Error(response.message || 'Failed to export bank accounts');
      }
      return response.data?.data || response.data?.url || '';
    } catch (error: any) {
      console.error('Export bank accounts error:', error);
      throw new Error(error.message || 'Failed to export bank accounts');
    }
  }
};