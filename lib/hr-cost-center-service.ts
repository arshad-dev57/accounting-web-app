import { apiClient } from '@/lib/api-client';

export type CostCenter = {
  id: string;
  companyId: string;
  code: string;
  name: string;
  description?: string;
  officeId?: string | null;
  officeName?: string | null;
  status: 'active' | 'inactive';
  employeeCount?: number;
  departmentCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

function unwrap(res: { success: boolean; data: any; message: string }) {
  const body = res.data ?? {};
  if (!res.success || body.success === false) {
    throw new Error(body.message || res.message || 'Request failed');
  }
  return body;
}

export const hrCostCenterService = {
  list: async (params: { search?: string; status?: string; officeId?: string; includeInactive?: boolean } = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
    });
    const q = qs.toString();
    const body = unwrap(await apiClient.get(`/api/hr/cost-centers${q ? `?${q}` : ''}`));
    return (body.data || []) as CostCenter[];
  },

  getById: async (id: string) => {
    const body = unwrap(await apiClient.get(`/api/hr/cost-centers/${id}`));
    return body.data as CostCenter;
  },

  create: async (input: Partial<CostCenter>) => {
    const body = unwrap(await apiClient.post('/api/hr/cost-centers', input));
    return body.data as CostCenter;
  },

  update: async (id: string, input: Partial<CostCenter>) => {
    const body = unwrap(await apiClient.put(`/api/hr/cost-centers/${id}`, input));
    return body.data as CostCenter;
  },

  setStatus: async (id: string, status: 'active' | 'inactive') => {
    const body = unwrap(await apiClient.patch(`/api/hr/cost-centers/${id}/status`, { status }));
    return body.data as CostCenter;
  },

  summaryReport: async (params: { period?: string; from?: string; to?: string } = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) qs.set(k, v);
    });
    const q = qs.toString();
    const body = unwrap(await apiClient.get(`/api/hr/cost-centers/reports/summary${q ? `?${q}` : ''}`));
    return body.data as Array<{
      id: string;
      code: string;
      name: string;
      status: string;
      employees: number;
      payrollItems: number;
      payrollCost: number;
      glDebit: number;
      glCredit: number;
    }>;
  },

  glReport: async (params: { costCenterId: string; from?: string; to?: string }) => {
    const qs = new URLSearchParams({ costCenterId: params.costCenterId });
    if (params.from) qs.set('from', params.from);
    if (params.to) qs.set('to', params.to);
    const body = unwrap(await apiClient.get(`/api/hr/cost-centers/reports/gl?${qs.toString()}`));
    return body.data as Array<{
      date: string;
      entryNumber: string;
      reference: string;
      description: string;
      accountCode: string;
      accountName: string;
      debit: number;
      credit: number;
      balance: number;
    }>;
  },
};
