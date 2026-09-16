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
  locationId?: string;
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
    locationId?: string;
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
      
      const rawPayload = response.data || {};
      const items: Income[] = Array.isArray(rawPayload.data)
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
      const fallbackTotalIncome = items.reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);
      const fallbackTotalTax = items.reduce((s, i) => s + (Number(i.taxAmount) || 0), 0);

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const fallbackThisMonth = items
        .filter(i => new Date(i.date) >= startOfMonth)
        .reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);
      const fallbackThisWeek = items
        .filter(i => new Date(i.date) >= startOfWeek)
        .reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);

      const stats: IncomeStats = rawPayload.stats || {
        totalIncome: fallbackTotalIncome,
        totalTax: fallbackTotalTax,
        totalCount: totalCount,
        thisMonth: fallbackThisMonth,
        thisWeek: fallbackThisWeek,
        byType: {}
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
          hasPrev: pageNum > 1
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
  getStats: async (params?: {
    startDate?: string;
    endDate?: string;
    locationId?: string;
    status?: string;
    incomeType?: string;
  }): Promise<IncomeStats> => {
    const query = new URLSearchParams();
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.locationId) query.append('locationId', params.locationId);
    if (params?.status) query.append('status', params.status);
    if (params?.incomeType) query.append('incomeType', params.incomeType);
    
    const url = `/api/income/summary${query.toString() ? `?${query.toString()}` : ''}`;
    
    try {
      const response = await apiClient.get(url);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch income stats');
      }
      const raw = response.data || {};
      const stats = raw.data || raw;
      return {
        totalIncome: Number(stats.totalIncome ?? 0),
        totalTax: Number(stats.totalTax ?? 0),
        totalCount: Number(stats.totalCount ?? 0),
        thisMonth: Number(stats.thisMonth ?? 0),
        thisWeek: Number(stats.thisWeek ?? 0),
        byType: stats.byType || {}
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