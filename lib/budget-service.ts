import { apiClient } from '@/lib/api-client';

export type BudgetStatus = 'Draft' | 'Approved' | 'Closed';

export interface BudgetDimensionDepartment {
  id: string;
  name: string;
  costCenterId?: string | null;
}

export interface BudgetDimensionCostCenter {
  id: string;
  code: string;
  name: string;
}

export interface BudgetDimensions {
  departments: BudgetDimensionDepartment[];
  costCenters: BudgetDimensionCostCenter[];
}

export interface BudgetAllocation {
  id?: string;
  periodKey: string;
  amount: number;
}

export interface BudgetLine {
  id?: string;
  accountId: string;
  amount: number;
  notes?: string;
  departmentId?: string | null;
  costCenterId?: string | null;
  account?: { id: string; code: string; name: string; type?: string };
  department?: { id: string; name: string } | null;
  costCenter?: { id: string; code: string; name: string } | null;
  allocations?: BudgetAllocation[];
}

export interface Budget {
  id: string;
  name: string;
  fiscalYearId: string;
  departmentId?: string | null;
  costCenterId?: string | null;
  startDate: string;
  endDate: string;
  notes?: string;
  status: BudgetStatus | string;
  totalAmount?: number;
  allocatedAmount?: number;
  lineCount?: number;
  fiscalYear?: { id: string; name: string; startDate?: string; endDate?: string; status?: string };
  department?: { id: string; name: string } | null;
  costCenter?: { id: string; code: string; name: string } | null;
  lines?: BudgetLine[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBudgetRequest {
  name: string;
  fiscalYearId: string;
  departmentId?: string | null;
  costCenterId?: string | null;
  startDate?: string;
  endDate?: string;
  notes?: string;
  status?: BudgetStatus | string;
  lines: Array<{
    accountId: string;
    amount: number;
    notes?: string;
    departmentId?: string | null;
    costCenterId?: string | null;
    allocations?: Array<{ periodKey: string; amount: number }>;
  }>;
}

export interface BudgetVsActualRow {
  budgetId: string;
  budgetName: string;
  budgetStatus: string;
  accountId: string;
  accountCode?: string;
  accountName?: string;
  departmentId?: string | null;
  departmentName?: string | null;
  costCenterId?: string | null;
  costCenterName?: string | null;
  budget: number;
  allocated: number;
  actual: number;
  variance: number;
  utilization: number;
  remaining?: number;
}

export interface BudgetVsActualResult {
  range?: { startDate: string; endDate: string };
  rows: BudgetVsActualRow[];
  totals: {
    budget: number;
    actual: number;
    allocated: number;
    variance: number;
    utilization?: number;
  };
}

function qs(params?: Record<string, string | number | boolean | undefined | null>) {
  const q = new URLSearchParams();
  if (!params) return '';
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

function unwrapData<T>(response: { success: boolean; data: any; message?: string }): T {
  if (!response.success) {
    throw new Error(response.message || response.data?.message || 'Request failed');
  }
  const body = response.data;
  if (body?.success === false) {
    throw new Error(body.message || 'Request failed');
  }
  return (body?.data !== undefined ? body.data : body) as T;
}

export const budgetService = {
  getDimensions: async (): Promise<BudgetDimensions> => {
    try {
      const response = await apiClient.get('/api/budgets/dimensions');
      const data = unwrapData<BudgetDimensions>(response);
      return {
        departments: data?.departments || [],
        costCenters: data?.costCenters || [],
      };
    } catch (error: any) {
      console.error('Get budget dimensions error:', error);
      return { departments: [], costCenters: [] };
    }
  },

  listBudgets: async (params: {
    fiscalYearId?: string;
    status?: string;
    departmentId?: string;
    costCenterId?: string;
  } = {}): Promise<Budget[]> => {
    const response = await apiClient.get(`/api/budgets${qs(params)}`);
    const data = unwrapData<Budget[]>(response);
    return Array.isArray(data) ? data : [];
  },

  getBudget: async (id: string): Promise<Budget> => {
    const response = await apiClient.get(`/api/budgets/${id}`);
    return unwrapData<Budget>(response);
  },

  createBudget: async (payload: CreateBudgetRequest): Promise<Budget> => {
    const response = await apiClient.post('/api/budgets', payload);
    return unwrapData<Budget>(response);
  },

  updateBudget: async (id: string, payload: Partial<CreateBudgetRequest>): Promise<Budget> => {
    const response = await apiClient.put(`/api/budgets/${id}`, payload);
    return unwrapData<Budget>(response);
  },

  deleteBudget: async (id: string): Promise<void> => {
    const response = await apiClient.delete(`/api/budgets/${id}`);
    if (!response.success) {
      throw new Error(response.message || response.data?.message || 'Failed to delete budget');
    }
  },

  setStatus: async (id: string, status: BudgetStatus | string): Promise<Budget> => {
    const response = await apiClient.patch(`/api/budgets/${id}/status`, { status });
    return unwrapData<Budget>(response);
  },

  budgetVsActual: async (params: {
    budgetId?: string;
    fiscalYearId?: string;
    departmentId?: string;
    costCenterId?: string;
    accountId?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<BudgetVsActualResult> => {
    const response = await apiClient.get(`/api/budgets/vs-actual${qs(params)}`);
    const data = unwrapData<BudgetVsActualResult>(response);
    return {
      range: data?.range,
      rows: Array.isArray(data?.rows) ? data.rows : [],
      totals: data?.totals || { budget: 0, actual: 0, allocated: 0, variance: 0 },
    };
  },
};
