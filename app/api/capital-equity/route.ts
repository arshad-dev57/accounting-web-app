import { apiClient } from '@/lib/api-client';

// ─── TYPES ─────────────────────────────────────────────────────

export interface EquityAccount {
  id: string;
  accountName: string;
  accountCode: string;
  accountType: 'Capital' | 'Retained Earnings' | 'Drawings' | 'Reserves';
  currentBalance: number;
  openingBalance: number;
  lastUpdated: string;
  description?: string;
}

export interface EquitySummary {
  totalCapital: number;
  totalRetainedEarnings: number;
  totalReserves: number;
  totalDrawings: number;
  totalEquity: number;
}

export interface OwnerTransaction {
  id: string;
  accountId: string;
  transactionType: 'Additional Capital' | 'Drawings' | 'Reserve Transfer';
  amount: number;
  description: string;
  reference?: string;
  transactionDate: string;
  createdAt: string;
}

export interface EquityListResponse {
  success: boolean;
  data: EquityAccount[];
  summary: EquitySummary;
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

export const equityService = {
  // ─── Get equity accounts with pagination and filters ───────────
  getEquityAccounts: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
  } = {}): Promise<EquityListResponse> => {
    const query = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });

    const url = `/api/equity${query.toString() ? `?${query.toString()}` : ''}`;
    
    try {
      const response = await apiClient.get(url);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch equity accounts');
      }
      
      const data = response.data || {};
      
      return {
        success: response.success,
        data: data.data || [],
        summary: data.summary || {
          totalCapital: 0,
          totalRetainedEarnings: 0,
          totalReserves: 0,
          totalDrawings: 0,
          totalEquity: 0
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
      console.error('Get equity accounts error:', error);
      throw new Error(error.message || 'Failed to fetch equity accounts');
    }
  },

  // ─── Get summary ──────────────────────────────────────────────
  getSummary: async (): Promise<EquitySummary> => {
    try {
      const response = await apiClient.get('/api/equity/summary');
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch summary');
      }
      return response.data?.data || {
        totalCapital: 0,
        totalRetainedEarnings: 0,
        totalReserves: 0,
        totalDrawings: 0,
        totalEquity: 0
      };
    } catch (error: any) {
      console.error('Get summary error:', error);
      throw new Error(error.message || 'Failed to fetch summary');
    }
  },

  // ─── Get transactions ───────────────────────────────────────────
  getTransactions: async (): Promise<OwnerTransaction[]> => {
    try {
      const response = await apiClient.get('/api/equity/transactions');
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch transactions');
      }
      return response.data?.data || [];
    } catch (error: any) {
      console.error('Get transactions error:', error);
      throw new Error(error.message || 'Failed to fetch transactions');
    }
  },

  // ─── Add capital ───────────────────────────────────────────────
  addCapital: async (data: {
    accountId: string;
    amount: number;
    description: string;
    reference?: string;
  }): Promise<any> => {
    try {
      const response = await apiClient.post('/api/equity/add-capital', data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to add capital');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Add capital error:', error);
      throw new Error(error.message || 'Failed to add capital');
    }
  },

  // ─── Record drawings ────────────────────────────────────────────
  recordDrawings: async (data: {
    accountId: string;
    amount: number;
    description: string;
    reference?: string;
  }): Promise<any> => {
    try {
      const response = await apiClient.post('/api/equity/record-drawings', data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to record drawings');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Record drawings error:', error);
      throw new Error(error.message || 'Failed to record drawings');
    }
  },

  // ─── Transfer to retained earnings ─────────────────────────────
  transferToRetainedEarnings: async (data: {
    amount: number;
    description: string;
  }): Promise<any> => {
    try {
      const response = await apiClient.post('/api/equity/transfer-retained-earnings', data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to transfer');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Transfer error:', error);
      throw new Error(error.message || 'Failed to transfer');
    }
  }
};
