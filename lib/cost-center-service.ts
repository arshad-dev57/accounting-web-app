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

/** Accounting Cost Centers — same company master as HR, no HR-manager gate. */
export const costCenterService = {
  list: async (
    params: { search?: string; status?: string; includeInactive?: boolean } = {}
  ) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
    });
    const q = qs.toString();
    const body = unwrap(await apiClient.get(`/api/cost-centers${q ? `?${q}` : ''}`));
    return (body.data || []) as CostCenter[];
  },

  getById: async (id: string) => {
    const body = unwrap(await apiClient.get(`/api/cost-centers/${id}`));
    return body.data as CostCenter;
  },

  create: async (input: Partial<CostCenter>) => {
    const body = unwrap(await apiClient.post('/api/cost-centers', input));
    return body.data as CostCenter;
  },

  update: async (id: string, input: Partial<CostCenter>) => {
    const body = unwrap(await apiClient.put(`/api/cost-centers/${id}`, input));
    return body.data as CostCenter;
  },

  setStatus: async (id: string, status: 'active' | 'inactive') => {
    const body = unwrap(
      await apiClient.patch(`/api/cost-centers/${id}/status`, { status })
    );
    return body.data as CostCenter;
  },
};
