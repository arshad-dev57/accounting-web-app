import { apiClient } from '@/lib/api-client';

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
  locationId?: string;
}

export const expenseService = {
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
    locationId?: string;
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

      const rawPayload = response.data || {};
      const items: Expense[] = Array.isArray(rawPayload.data)
        ? rawPayload.data
        : Array.isArray(rawPayload)
        ? rawPayload
        : [];

      const totalCount = typeof rawPayload.total === 'number'
        ? rawPayload.total
        : typeof rawPayload.count === 'number'
        ? rawPayload.count
        : items.length;

      const pageNum = rawPayload.page || params.page || 1;
      const limitNum = params.limit || 10;
      const totalPages = rawPayload.pages || Math.ceil(totalCount / limitNum) || 1;

      // Calculate fallback stats directly from loaded items if rawPayload.stats is missing
      const fallbackTotalExpense = items.reduce((s, e) => s + (Number(e.totalAmount) || 0), 0);
      const fallbackTotalTax = items.reduce((s, e) => s + (Number(e.taxAmount) || 0), 0);

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const fallbackThisMonth = items
        .filter(e => new Date(e.date) >= startOfMonth)
        .reduce((s, e) => s + (Number(e.totalAmount) || 0), 0);
      const fallbackThisWeek = items
        .filter(e => new Date(e.date) >= startOfWeek)
        .reduce((s, e) => s + (Number(e.totalAmount) || 0), 0);

      const stats: ExpenseStats = rawPayload.stats || {
        totalExpense: fallbackTotalExpense,
        totalTax: fallbackTotalTax,
        totalCount: totalCount,
        thisMonth: fallbackThisMonth,
        thisWeek: fallbackThisWeek,
        byType: {},
      };

      return {
        success: response.success,
        data: items,
        stats,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          pages: totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
        },
      };
    } catch (error: any) {
      console.error('Get expenses error:', error);
      throw new Error(error.message || 'Failed to fetch expenses');
    }
  },

  createExpense: async (data: CreateExpenseRequest): Promise<Expense> => {
    const response = await apiClient.post('/api/expenses', data);
    if (!response.success) {
      throw new Error(response.message || 'Failed to create expense');
    }
    return response.data?.data;
  },

  getExpenseById: async (id: string): Promise<Expense> => {
    const response = await apiClient.get(`/api/expenses/${id}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch expense');
    }
    return response.data?.data;
  },

  postExpense: async (id: string): Promise<Expense> => {
    const response = await apiClient.post(`/api/expenses/${id}/post`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to post expense');
    }
    return response.data?.data;
  },

  deleteExpense: async (id: string): Promise<void> => {
    const response = await apiClient.delete(`/api/expenses/${id}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete expense');
    }
  },

  updateExpense: async (id: string, data: Partial<CreateExpenseRequest>): Promise<Expense> => {
    const response = await apiClient.put(`/api/expenses/${id}`, data);
    if (!response.success) {
      throw new Error(response.message || 'Failed to update expense');
    }
    return response.data?.data;
  },

  getStats: async (params?: {
    startDate?: string;
    endDate?: string;
    locationId?: string;
    status?: string;
    expenseType?: string;
  }): Promise<ExpenseStats> => {
    const query = new URLSearchParams();
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.locationId) query.append('locationId', params.locationId);
    if (params?.status) query.append('status', params.status);
    if (params?.expenseType) query.append('expenseType', params.expenseType);

    const url = `/api/expenses/summary${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await apiClient.get(url);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch expense stats');
    }
    const raw = response.data || {};
    const stats = raw.data || raw;
    return {
      totalExpense: Number(stats.totalExpense ?? 0),
      totalTax: Number(stats.totalTax ?? 0),
      totalCount: Number(stats.totalCount ?? 0),
      thisMonth: Number(stats.thisMonth ?? 0),
      thisWeek: Number(stats.thisWeek ?? 0),
      byType: stats.byType || {},
    };
  },

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
    const response = await apiClient.get(url);
    if (!response.success) {
      throw new Error(response.message || 'Failed to export expenses');
    }
    return response.data?.data || response.data?.url || '';
  },
};
