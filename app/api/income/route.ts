import { apiClient } from '@/lib/api-client';

// ─── TYPES ─────────────────────────────────────────────────────

export interface IncomeItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Income {
  id: string;
  incomeNumber: string;
  date: string;
  incomeType: string;
  customerId?: string;
  customerName: string;
  items: IncomeItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  description: string;
  reference: string;
  paymentMethod: string;
  bankAccountId?: string;
  status: 'Draft' | 'Posted' | 'Cancelled';
  incomeAccount?: {
    id: string;
    code: string;
    name: string;
  };
  incomeAccountId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IncomeStats {
  totalIncome: number;
  totalTax: number;
  totalCount: number;
  thisMonth: number;
  thisWeek: number;
  byType: Record<string, number>;
}

export interface IncomeAccount {
  id: string;
  _id?: string;
  code: string;
  name: string;
  type: string;
}

export interface Customer {
  id: string;
  _id?: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface BankAccount {
  id: string;
  _id?: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
}

export interface IncomeListResponse {
  success: boolean;
  data: Income[];
  stats: IncomeStats;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreateIncomeRequest {
  date: string;
  incomeType: string;
  incomeAccountId: string;
  customerId?: string;
  items?: IncomeItem[];
  amount?: number;
  taxRate?: number;
  description?: string;
  reference?: string;
  paymentMethod: string;
  bankAccountId?: string;
}

// ─── SERVICE ──────────────────────────────────────────────────

export const incomeService = {
  // ─── Get income accounts ─────────────────────────────────────
  getIncomeAccounts: async (): Promise<IncomeAccount[]> => {
    try {
      const response = await apiClient.get('/api/income/accounts');
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch income accounts');
      }
      return response.data?.data || [];
    } catch (error: any) {
      console.error('Get income accounts error:', error);
      return [];
    }
  },

  // ─── Get customers ───────────────────────────────────────────
  getCustomers: async (): Promise<Customer[]> => {
    try {
      const response = await apiClient.get('/api/customers');
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch customers');
      }
      return response.data?.data || [];
    } catch (error: any) {
      console.error('Get customers error:', error);
      return [];
    }
  },

  // ─── Get bank accounts ──────────────────────────────────────
  getBankAccounts: async (): Promise<BankAccount[]> => {
    try {
      const response = await apiClient.get('/api/bank-accounts');
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch bank accounts');
      }
      return response.data?.data || [];
    } catch (error: any) {
      console.error('Get bank accounts error:', error);
      return [];
    }
  },

  // ─── Get incomes with pagination and filters ────────────────
  getIncomes: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    incomeType?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<IncomeListResponse> => {
    const query = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });

    const url = `/api/income/list${query.toString() ? `?${query.toString()}` : ''}`;
    
    try {
      const response = await apiClient.get(url);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch incomes');
      }
      
      const data = response.data || {};
      
      return {
        success: response.success,
        data: data.data || [],
        stats: data.stats || {
          totalIncome: 0,
          totalTax: 0,
          totalCount: 0,
          thisMonth: 0,
          thisWeek: 0,
          byType: {}
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
      console.error('Get incomes error:', error);
      throw new Error(error.message || 'Failed to fetch incomes');
    }
  },

  // ─── Create income ───────────────────────────────────────────
  createIncome: async (data: CreateIncomeRequest): Promise<Income> => {
    try {
      const response = await apiClient.post('/api/income', data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to create income');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Create income error:', error);
      throw new Error(error.message || 'Failed to create income');
    }
  },

  // ─── Get income by ID ────────────────────────────────────────
  getIncomeById: async (id: string): Promise<Income> => {
    try {
      const response = await apiClient.get(`/api/income/${id}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch income');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Get income error:', error);
      throw new Error(error.message || 'Failed to fetch income');
    }
  },

  // ─── Post income ─────────────────────────────────────────────
  postIncome: async (id: string): Promise<Income> => {
    try {
      const response = await apiClient.post(`/api/income/${id}/post`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to post income');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Post income error:', error);
      throw new Error(error.message || 'Failed to post income');
    }
  },

  // ─── Delete income ───────────────────────────────────────────
  deleteIncome: async (id: string): Promise<void> => {
    try {
      const response = await apiClient.delete(`/api/income/${id}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete income');
      }
    } catch (error: any) {
      console.error('Delete income error:', error);
      throw new Error(error.message || 'Failed to delete income');
    }
  },

  // ─── Update income ───────────────────────────────────────────
  updateIncome: async (id: string, data: Partial<CreateIncomeRequest>): Promise<Income> => {
    try {
      const response = await apiClient.put(`/api/income/${id}`, data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update income');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Update income error:', error);
      throw new Error(error.message || 'Failed to update income');
    }
  },

  // ─── Get income stats ────────────────────────────────────────
  getStats: async (params?: { startDate?: string; endDate?: string }): Promise<IncomeStats> => {
    const query = new URLSearchParams();
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    
    const url = `/api/income/summary${query.toString() ? `?${query.toString()}` : ''}`;
    
    try {
      const response = await apiClient.get(url);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch income stats');
      }
      return response.data?.data || {
        totalIncome: 0,
        totalTax: 0,
        totalCount: 0,
        thisMonth: 0,
        thisWeek: 0,
        byType: {}
      };
    } catch (error: any) {
      console.error('Get income stats error:', error);
      throw new Error(error.message || 'Failed to fetch income stats');
    }
  },

  // ─── Export incomes ──────────────────────────────────────────
  exportIncomes: async (params?: {
    format?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<string> => {
    const query = new URLSearchParams();
    if (params?.format) query.append('format', params.format);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    
    const url = `/api/income/export${query.toString() ? `?${query.toString()}` : ''}`;
    
    try {
      const response = await apiClient.get(url);
      if (!response.success) {
        throw new Error(response.message || 'Failed to export incomes');
      }
      return response.data?.data || response.data?.url || '';
    } catch (error: any) {
      console.error('Export incomes error:', error);
      throw new Error(error.message || 'Failed to export incomes');
    }
  }
};