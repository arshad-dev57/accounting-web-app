import { apiClient } from '@/lib/api-client';

// ─── TYPES ─────────────────────────────────────────────────────

export interface ExpenseItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Expense {
  id: string;
  expenseNumber: string;
  date: string;
  expenseType: string;
  vendorId?: string;
  vendorName: string;
  items: ExpenseItem[];
  amount: number;
  hasItems: boolean;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  description: string;
  reference: string;
  paymentMethod: string;
  bankAccountId?: string;
  bankAccount?: any;
  status: 'Draft' | 'Posted' | 'Cancelled';
  expenseAccount?: {
    id: string;
    code: string;
    name: string;
  };
  expenseAccountId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseStats {
  totalExpense: number;
  totalTax: number;
  totalCount: number;
  thisMonth: number;
  thisWeek: number;
  byType: Record<string, number>;
}

export interface ExpenseAccount {
  id: string;
  _id?: string;
  code: string;
  name: string;
  type: string;
}

export interface Vendor {
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

export interface ExpenseListResponse {
  success: boolean;
  data: Expense[];
  stats: ExpenseStats;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreateExpenseRequest {
  date: string;
  expenseType: string;
  expenseAccountId: string;
  vendorId?: string;
  items?: ExpenseItem[];
  amount?: number;
  taxRate?: number;
  description?: string;
  reference?: string;
  paymentMethod: string;
  bankAccountId?: string;
}

// ─── SERVICE ──────────────────────────────────────────────────

export const expenseService = {
  // ─── Get expense accounts ─────────────────────────────────────
  getExpenseAccounts: async (): Promise<ExpenseAccount[]> => {
    try {
      const response = await apiClient.get('/api/expenses/accounts');
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch expense accounts');
      }
      return response.data?.data || [];
    } catch (error: any) {
      console.error('Get expense accounts error:', error);
      return [];
    }
  },

  // ─── Get vendors (suppliers) ─────────────────────────────────────
  getVendors: async (): Promise<Vendor[]> => {
    try {
      const response = await apiClient.get('/api/accounts-payable/suppliers');
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch vendors');
      }
      return response.data?.data || [];
    } catch (error: any) {
      console.error('Get vendors error:', error);
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

  // ─── Get expenses with pagination and filters ────────────────
  getExpenses: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    expenseType?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<ExpenseListResponse> => {
    const query = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });

    const url = `/api/expenses${query.toString() ? `?${query.toString()}` : ''}`;
    
    try {
      const response = await apiClient.get(url);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch expenses');
      }
      
      const data = response.data || {};
      
      return {
        success: response.success,
        data: data.data || [],
        stats: data.stats || {
          totalExpense: 0,
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
      console.error('Get expenses error:', error);
      throw new Error(error.message || 'Failed to fetch expenses');
    }
  },

  // ─── Create expense ───────────────────────────────────────────
  createExpense: async (data: CreateExpenseRequest): Promise<Expense> => {
    try {
      const response = await apiClient.post('/api/expenses', data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to create expense');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Create expense error:', error);
      throw new Error(error.message || 'Failed to create expense');
    }
  },

  // ─── Get expense by ID ────────────────────────────────────────
  getExpenseById: async (id: string): Promise<Expense> => {
    try {
      const response = await apiClient.get(`/api/expenses/${id}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch expense');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Get expense error:', error);
      throw new Error(error.message || 'Failed to fetch expense');
    }
  },

  postExpense: async (id: string): Promise<Expense> => {
    try {
      const response = await apiClient.post(`/api/expenses/${id}/post`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to post expense');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Post expense error:', error);
      throw new Error(error.message || 'Failed to post expense');
    }
  },

  // ─── Delete expense ───────────────────────────────────────────
  deleteExpense: async (id: string): Promise<void> => {
    try {
      const response = await apiClient.delete(`/api/expenses/${id}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete expense');
      }
    } catch (error: any) {
      console.error('Delete expense error:', error);
      throw new Error(error.message || 'Failed to delete expense');
    }
  },

  // ─── Update expense ───────────────────────────────────────────
  updateExpense: async (id: string, data: Partial<CreateExpenseRequest>): Promise<Expense> => {
    try {
      const response = await apiClient.put(`/api/expenses/${id}`, data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update expense');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Update expense error:', error);
      throw new Error(error.message || 'Failed to update expense');
    }
  },

  // ─── Get expense stats ────────────────────────────────────────
  getStats: async (params?: { startDate?: string; endDate?: string }): Promise<ExpenseStats> => {
    const query = new URLSearchParams();
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    
    const url = `/api/expenses/summary${query.toString() ? `?${query.toString()}` : ''}`;
    
    try {
      const response = await apiClient.get(url);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch expense stats');
      }
      return response.data?.data || {
        totalExpense: 0,
        totalTax: 0,
        totalCount: 0,
        thisMonth: 0,
        thisWeek: 0,
        byType: {}
      };
    } catch (error: any) {
      console.error('Get expense stats error:', error);
      throw new Error(error.message || 'Failed to fetch expense stats');
    }
  },

  // ─── Export expenses ──────────────────────────────────────────
  exportExpenses: async (params?: {
    format?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<string> => {
    const query = new URLSearchParams();
    if (params?.format) query.append('format', params.format);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    
    const url = `/api/expenses/export${query.toString() ? `?${query.toString()}` : ''}`;
    
    try {
      const response = await apiClient.get(url);
      if (!response.success) {
        throw new Error(response.message || 'Failed to export expenses');
      }
      return response.data?.data || response.data?.url || '';
    } catch (error: any) {
      console.error('Export expenses error:', error);
      throw new Error(error.message || 'Failed to export expenses');
    }
  }
};